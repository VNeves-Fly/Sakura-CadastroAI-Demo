import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocSpec() {
  return createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Cadastro IA Sakura API",
        version: "0.1.0",
        description: "Documentação dos endpoints REST do backend (módulos auth/users/cadastro).",
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "next-auth.session-token",
          },
        },
        schemas: {
          User: {
            type: "object",
            properties: {
              id: { type: "string", example: "clx1a2b3c" },
              name: { type: "string", example: "Ada Lovelace" },
              email: { type: "string", format: "email", example: "ada@example.com" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          CreateUserInput: {
            type: "object",
            required: ["name", "email", "password"],
            properties: {
              name: { type: "string", minLength: 2, example: "Ada Lovelace" },
              email: { type: "string", format: "email", example: "ada@example.com" },
              password: { type: "string", minLength: 8, example: "senha-forte-123" },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
  });
}
