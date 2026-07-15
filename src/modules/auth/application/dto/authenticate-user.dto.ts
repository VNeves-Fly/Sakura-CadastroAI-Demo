export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticateUserOutput {
  id: string;
  name: string;
  email: string;
}
