export interface UserView {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserFormValues {
  name: string;
  email: string;
  password: string;
}
