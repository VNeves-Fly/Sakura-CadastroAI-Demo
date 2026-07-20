import type { Cargo } from "@/modules/users/domain/enums";

export interface UserProps {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string {
    return this.props.phone;
  }

  get cargo(): Cargo {
    return this.props.cargo;
  }

  get mustChangePassword(): boolean {
    return this.props.mustChangePassword;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Omit<UserProps, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.props.id,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      email: this.props.email,
      phone: this.props.phone,
      cargo: this.props.cargo,
      mustChangePassword: this.props.mustChangePassword,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
