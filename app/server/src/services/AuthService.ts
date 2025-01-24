import { PrismaClient } from "@prisma/client";
import { InvariantError, NotFoundError } from "../common/exception";
import { IInstitution, IPayloadToken, RegisterPayloadType } from "../types/auth";
import { AuthenticationError } from "../common/exception/AuthenticationError";
import { generateFutureDate } from "../common/utils";
import { INodemailerMessage } from "../types/email";
import { EmailService } from "./EmailService";


export class AuthService {
    constructor(public prismaClient: PrismaClient, public bcrypt: any, public jwt: any, public emailService: EmailService) { }

    async register({
        username, email, password, roleId = 4, isVerified = false
    }: RegisterPayloadType): Promise<{
        newUser: {
            id: number;
            username: string;
            email: string;
            password: string;
            roleId: number;
            isVerified: boolean;
        }
    }> {
        const isUserExistsOnDatabase = await this.isUserExistsOnDatabase(username, email);

        if (isUserExistsOnDatabase) {
            throw new InvariantError('User already exists');
        }

        const newPassword = await this.bcrypt.hash(password, 10);

        const newUser = await this.prismaClient.user.create({
            data: {
                username,
                email,
                password: newPassword,
                role_id: roleId,
                is_verified: roleId === 4 ? true : isVerified
            },
        });

        return {
            newUser: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                password: newUser.password,
                roleId: newUser.role_id,
                isVerified: newUser.is_verified
            }
        }
    }

    async registerForInstitution(payload: IInstitution & Omit<RegisterPayloadType, 'isVerified'>) {
        const isUserExistsOnDatabase = await this.isUserExistsOnDatabase(payload.username, payload.email);
        if (isUserExistsOnDatabase) {
            throw new InvariantError('User already exists');
        }

        const newPassword = await this.bcrypt.hash(payload.password, 10);

        const userInstitution = await this.prismaClient.user.create({
            data: {
                username: payload.username,
                email: payload.email,
                password: newPassword,
                role_id: payload.roleId,
                is_verified: false,
                institution: {
                    create: {
                        name: payload.name,
                        address: payload.address,
                        phone_number: payload.phoneNumber,
                        email: payload.email,
                        head_name: payload.headName,
                        head_nip: payload.headNIP,
                        license_document: payload.licenseDocument,
                        institution_type: {
                            connect: {
                                id: payload.roleId === 2 ? 1 : 2
                            }
                        }
                    }
                }
            },
            include: {
                institution: {
                    select: {
                        name: true,
                        address: true,
                        phone_number: true,
                        email: true,
                        head_name: true,
                        head_nip: true,
                        license_document: true,
                        institution_type: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })
        return {
            userInstitution
        }
    }

    async sendEmailVerification(email: string) {
        const { user } = await this.getUserByUniqueIdentity(email);
        const generatedToken = this.jwt.sign({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role_id
        }, process.env.SECRET_ACCESS_TOKEN ?? 'SECRET_TOKEN_RAHASIA', {
            expiresIn: 3600 * 24 * 7
        });

        if (user.is_verified) {
            return {
                user: null
            };
        }
        const generatedDate = generateFutureDate(7);

        const payload: INodemailerMessage = {
            from: process.env.SMTP_EMAIL ?? 'admin@gmail.com',
            to: email,
            subject: 'Email Verification',
            html: `
                        <p>Click this link before <strong>${generatedDate}</strong> to verify your email: <a href="${process.env.API_BASE_URL ?? 'http://localhost:5000'}/auth/email/verify?token=${generatedToken}">Verify Email</a></p>
                        `
        }

        await this.emailService.sendEmail(payload);

        return { user }
    }

    async sendEmailRegistration(payload: { schoolId: number, healthCareId: number, email: string, name: string, senderEmail: string }) {
        const generatedToken = this.jwt.sign({
            schoolId: payload.schoolId,
            healthCareId: payload.healthCareId,
            email: payload.email,
            name: payload.name,
        }, process.env.SECRET_ACCESS_TOKEN, {
            expiresIn: 3600 * 24 * 7
        })
        const generatedDate = generateFutureDate(7);
        await this.emailService.sendEmail({
            from: payload.senderEmail,
            to: payload.email,
            subject: 'Email Registration',
            html: `
                <p>Click this link to complete your registration before <strong>${generatedDate}</strong> <a href="${process.env.FRONT_END_COMPLETE_REGISTRATION_URL}?token=${generatedToken}">Complete Registration</a></p>
            `
        })
    }

    async getUserByKey(value: any) {
        const user = await this.prismaClient.user.findFirst({
            where: {
                institution: {
                    id: value
                }
            }
        })

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return { user }
    }

    async isUserExistsOnDatabase(username: string, email: string): Promise<boolean> {
        const userOnDatabase = await this.prismaClient.user.findFirst({
            where: {
                OR: [{ username }, { email }]
            }
        })
        return !!userOnDatabase;
    }

    async login(uniqueIdentity: string, password: string): Promise<{
        accessToken: string;
    }> {
        const userOnDatabase = await this.prismaClient.user.findFirst({
            where: {
                OR: [
                    { username: uniqueIdentity },
                    { email: uniqueIdentity }
                ]
            }
        })

        if (!userOnDatabase) {
            throw new NotFoundError('User not found');
        }

        const isPasswordMatch = await this.bcrypt.compare(password, userOnDatabase.password);
        if (!isPasswordMatch) {
            throw new AuthenticationError('Password is incorrect');
        }
        if (!userOnDatabase.is_verified) {
            throw new AuthenticationError('User not verified');
        }
        const userRole = await this.prismaClient.role.findUnique({
            where: {
                id: userOnDatabase.role_id
            }
        })

        const accessToken = this.jwt.sign({
            id: userOnDatabase.id,
            username: userOnDatabase.username,
            email: userOnDatabase.email,
            role: userRole?.name ?? 'parent'
        }, process.env.SECRET_ACCESS_TOKEN ?? 'accesstokenrahasia', {
            expiresIn: 3600 * 3
        })

        return {
            accessToken
        }
    };

    async getUserByUniqueIdentity(uniqueIdentity: string) {
        const user = await this.prismaClient.user.findFirst({
            where: {
                OR: [
                    { username: uniqueIdentity },
                    { email: uniqueIdentity }
                ]
            }
        })

        if (!user) {
            throw new NotFoundError('User not found');
        }
        return {
            user
        }
    }

    async verifyEmail(token: string) {
        const decodedToken: IPayloadToken = this.jwt.verify(token, process.env.SECRET_ACCESS_TOKEN ?? 'secretaccesstoken');
        const user = await this.prismaClient.user.findUnique({
            where: {
                id: decodedToken.id
            }
        })

        if (!user) {
            throw new NotFoundError('User not found');
        }
        if (!user.is_verified) {
            const updatedUser = await this.prismaClient.user.update({
                data: {
                    is_verified: true
                },
                where: {
                    id: decodedToken.id
                }
            })
            return { user: updatedUser, message: 'User Verified Successfully' }

        }

        return { user: null, message: 'User already verified' };
    }

    async verifyHealthcareMemberRegistrationEmail(token: string, payload: RegisterPayloadType) {
        const { schoolId, healthCareId, email, name } = this.jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        const newHealthCaremember = await this.prismaClient.healthCareMember.create({
            data: {
                user: {
                    create: {
                        username: payload.username,
                        email: payload.email,
                        password: payload.password,
                        role_id: 5,
                        is_verified: true,
                    }
                },
                health_care: {
                    connect: {
                        id: healthCareId
                    }
                },
                name,
                position: {
                    connect: {
                        id: 2
                    }
                }
            }
        });

        return {
            healthCareMember: newHealthCaremember
        }
    }
}