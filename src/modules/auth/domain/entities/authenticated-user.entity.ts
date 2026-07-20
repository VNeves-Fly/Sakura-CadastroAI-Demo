export interface AuthenticatedUserProps {
  id: string;
  name: string;
  email: string;
  mustChangePassword: boolean;
}

export class AuthenticatedUser {
  private constructor(private readonly props: AuthenticatedUserProps) {}

  static create(props: AuthenticatedUserProps): AuthenticatedUser {
    return new AuthenticatedUser(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get mustChangePassword(): boolean {
    return this.props.mustChangePassword;
  }

  toJSON(): AuthenticatedUserProps {
    return { ...this.props };
  }
}
