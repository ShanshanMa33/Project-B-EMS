import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";
import onboardingReducer from "./onboardingSlice";
import visaReducer from "./visaSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        profile: profileReducer,
        onboarding: onboardingReducer,
        visa: visaReducer,
    },
});

export default store;