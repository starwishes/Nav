import Joi from 'joi';

export const loginSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    level: Joi.number().integer().min(1).max(3).optional()
});

export const itemSchema = Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
    description: Joi.string().allow(''),
    categoryId: Joi.number().required(),
    private: Joi.boolean().default(false),
    pinned: Joi.boolean().default(false),
    level: Joi.number().integer().min(0).max(3).default(0),
    clickCount: Joi.number().integer().min(0).optional(),
    lastVisited: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
});

export const categorySchema = Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    private: Joi.boolean().optional(),
    level: Joi.number().integer().min(0).max(3).default(0),
});

export const dataSchema = Joi.object({
    content: Joi.object({
        categories: Joi.array().items(categorySchema).required(),
        items: Joi.array().items(itemSchema).required(),
    }).required(),
});
