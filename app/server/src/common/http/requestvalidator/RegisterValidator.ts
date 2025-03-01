import joi from 'joi';

export const registerPayloadSchema = joi.object({
    username: joi.string().min(3).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    role: joi.number().custom((value, helpers) => {
        if (value !== 4) {
            return helpers.error('Role must be 1, 2, 3, or 4');
        }
        return value;
    })
})

export const institutionRegisterPayloadSchema = joi.object({
    username: joi.string().min(3).required(),
    password: joi.string().min(6).required(),
    address: joi.string().required(),
    headNip: joi.string(),
    headName: joi.string(),
    name: joi.string().required(),
    phoneNumber: joi.string().required(),
    email: joi.string().email().required(),
    roleId: joi.number().custom((value, helpers) => {
        if (value !== 2 && value !== 3) {
            return helpers.error('ONLY School (2) and Health Care (3) are allowed');
        }
        return value;
    })
})
