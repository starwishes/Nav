import Joi from 'joi';

/**
 * 密码强度规则：
 * - 至少 8 个字符
 * - 必须包含大写字母、小写字母、数字、特殊符号
 */
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const loginSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(), // 登录时不强制复杂密码（兼容旧账户）
    level: Joi.number().integer().min(1).max(3).optional()
});

// 注册/修改密码时使用强密码验证
export const strongPasswordSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string()
        .pattern(passwordPattern)
        .required()
        .messages({
            'string.pattern.base': '密码必须至少8位，包含大小写字母、数字和特殊符号'
        }),
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
