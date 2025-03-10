"use client";

import { useState } from "react";
import styles from "@/styles/auth/LoginForm.module.scss";
import Airplane from "@/components/animations/Airplane";
import { useRouter } from "next/navigation";
import { useAuthAction } from "@/recoil/actions/auth";
import { useRecoilValue } from "recoil";
import { authState } from "@/recoil/states/auth";

const LoginForm = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [formError, setFormError] = useState("");

    const [isFlying, setIsFlying] = useState(false);

    const { login } = useAuthAction();
    const auth = useRecoilValue(authState);

    const validateEmail = (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    };

    const validatePassword = (value: string) => {
        return value.length >= 8;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (!validateEmail(value)) {
            setEmailError("invalid email");
        } else {
            setEmailError("");
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (!validatePassword(value)) {
            setPasswordError("invalid password");
        } else {
            setPasswordError("");
        }
    };

    const submitLogin = async () => {
        try {
            const base64Auth = Buffer.from(`${email}:${password}`).toString("base64");
            await login(base64Auth);
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let valid = true;

        if (!validateEmail(email)) {
            setEmailError("invalid email");
            valid = false;
        }
        if (!validatePassword(password)) {
            setPasswordError("invalid password");
            valid = false;
        }

        if (!valid) {
            setFormError("invalid email or password");
            return;
        }

        const loginSuccess = await submitLogin();

        if (loginSuccess) {
            setFormError("");
            await handleAirplane();
            router.push("/");
        }
    };

    const handleAirplane = () => {
        return new Promise((resolve) => {
            setIsFlying(true);
            setTimeout(() => {
                setIsFlying(false);
                resolve(true);
            }, 2000);
        });
    };

    return (
        <>
            <form className={styles.form} onSubmit={(e) => handleLogin(e)}>
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email</label>

                    <input id="email" type="text" value={email} onChange={handleEmailChange} />
                    {emailError && <p className={styles.error}>{emailError}</p>}
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" value={password} onChange={handlePasswordChange} />
                    {passwordError && <p className={styles.error}>{passwordError}</p>}
                </div>
                <button type="submit" className={styles.button}>
                    Sign In
                </button>
                {formError && <p className={styles.error}>{formError}</p>}
                {auth.error && <p className={styles.error}>로그인 실패: {auth.error}</p>}
                {auth.loading && <p className={styles.loading}>로그인 중...</p>}
            </form>
            <Airplane isFlying={isFlying} />
        </>
    );
};

export default LoginForm;
