import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";
import onboardingReducer from "./onboardingSlice";
import visaReducer from "./visaSlice";
import hrReducer from "./hrSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        profile: profileReducer,
        onboarding: onboardingReducer,
        visa: visaReducer,
        hr: hrReducer,
    },
});

export default store;
