import { api } from "./client";

export const getUserMe = () => api.get("/api/users/me");

export const getEmployeeProfile = () => api.get("/api/employee/profile");

export const updateEmployeeProfile = (payload) =>
    api.put("/api/employee/profile", payload);

