import { ResetPasswordView } from "@/modules/auth/views/reset-password-view";

export default function RedefinirSenhaPage({ params }: { params: { token: string } }) {
  return <ResetPasswordView token={params.token} />;
}
