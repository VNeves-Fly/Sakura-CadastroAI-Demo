import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import type { RawUserResponse } from "@/modules/users/services/users.service";

describe("usersAdapter.toServiceInput", () => {
  it("normaliza o e-mail (trim + minúsculo) e o nome (trim)", () => {
    expect(
      usersAdapter.toServiceInput({
        name: "  Fulano de Tal  ",
        email: "  Fulano@Empresa.COM  ",
        password: "senha-forte-123",
      }),
    ).toEqual({
      name: "Fulano de Tal",
      email: "fulano@empresa.com",
      password: "senha-forte-123",
    });
  });

  it("não mexe na senha (case-sensitive por natureza)", () => {
    const resultado = usersAdapter.toServiceInput({
      name: "Fulano",
      email: "fulano@empresa.com",
      password: "SenhaComMaiuscula123",
    });
    expect(resultado.password).toBe("SenhaComMaiuscula123");
  });
});

describe("usersAdapter.toView / toViewList", () => {
  const raw: RawUserResponse = {
    id: "1",
    name: "Fulano",
    email: "fulano@empresa.com",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  it("toView expõe só os campos que a view precisa (sem updatedAt)", () => {
    expect(usersAdapter.toView(raw)).toEqual({
      id: "1",
      name: "Fulano",
      email: "fulano@empresa.com",
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
