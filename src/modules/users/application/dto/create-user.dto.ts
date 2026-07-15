export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UserOutput {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
