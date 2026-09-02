import { createFileRoute } from "@tanstack/react-router";
import { UserRegister } from "./user-register";

export const Route = createFileRoute("/users/register")({
  component: UserRegister,
});
