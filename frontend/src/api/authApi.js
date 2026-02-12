import { api } from "./client";

const AUTH_BASE = "/api/auth";

export const login = ({ username, password }) =>
    api.post(`${AUTH_BASE}/signin`, { username, password });

export const getRegistrationTokenStatus = (token) =>
    api.get(`${AUTH_BASE}/registration-token-status`, { params: { token } });

export const registerWithInvitationToken = ({ token, username, password }) =>
    api.post(`${AUTH_BASE}/register-with-token`, { token, username, password });
