import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import type { RawUserResponse } from "@/modules/users/services/users.service";

describe("usersAdapter.toServiceInput", () => {
  it("normaliza e-mail (trim + minúsculo), nome, sobrenome e telefone (trim), e fixa senha temporária + boas-vindas", () => {
    expect(
      usersAdapter.toServiceInput({
        firstName: "  Fulano  ",
        lastName: "  de Tal  ",
        email: "  Fulano@Empresa.COM  ",
        phone: "  11912345678  ",
        cargo: "ANALISTA",
        ativo: true,
      }),
    ).toEqual({
      firstName: "Fulano",
      lastName: "de Tal",
      email: "fulano@empresa.com",
      phone: "11912345678",
      cargo: "ANALISTA",
      mustChangePassword: true,
      useTemporaryPassword: true,
      ativo: true,
    });
  });
});

describe("usersAdapter.toUpdateServiceInput", () => {
  it("normaliza e-mail, nome, sobrenome e telefone, repassando ativo tal qual", () => {
    expect(
      usersAdapter.toUpdateServiceInput({
        firstName: "  Fulano  ",
        lastName: "  Tal  ",
        email: "  Fulano@Empresa.COM  ",
        phone: "  11912345678  ",
        cargo: "GESTOR",
        ativo: false,
      }),
    ).toEqual({
      firstName: "Fulano",
      lastName: "Tal",
      email: "fulano@empresa.com",
      phone: "11912345678",
      cargo: "GESTOR",
      ativo: false,
    });
  });
});

describe("usersAdapter.toView / toViewList", () => {
  const raw: RawUserResponse = {
    id: "1",
    firstName: "Fulano",
    lastName: "Tal",
    email: "fulano@empresa.com",
    phone: "11912345678",
    cargo: "ANALISTA",
    mustChangePassword: false,
    ativo: true,
    lastLoginAt: "2026-01-05T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  it("toView expõe só os campos que a view precisa (sem updatedAt/mustChangePassword)", () => {
    expect(usersAdapter.toView(raw)).toEqual({
      id: "1",
      firstName: "Fulano",
      lastName: "Tal",
      email: "fulano@empresa.com",
      phone: "11912345678",
      cargo: "ANALISTA",
      ativo: true,
      lastLoginAt: "2026-01-05T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("toViewList mapeia a lista inteira usando a mesma regra do toView", () => {
    expect(usersAdapter.toViewList([raw, { ...raw, id: "2" }])).toEqual([
      usersAdapter.toView(raw),
      usersAdapter.toView({ ...raw, id: "2" }),
    ]);
  });
});
