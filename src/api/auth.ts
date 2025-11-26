import axiosClient from "./axiosClient";

export type LoginResponse = {
  access: string;
  refresh: string;
};

export async function login(
  username: string,
  password: string,
  school: string
): Promise<LoginResponse> {
  const res = await axiosClient.post("/token/", {
    username,
    password,
    school,
  });

  return res.data;
}

export async function getMe() {
  const res = await axiosClient.get("/teachers/me/");
  return res.data;
}
