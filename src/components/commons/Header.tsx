import styles from "./Header.module.scss";
import Image from "next/image";
import Link from "next/link";
import ClientLogoutButton from "./ClientLogoutButton";

// 서버 컴포넌트로 변경
const Header = async () => {

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <Link href="/">
                    <Image src="/logo.png" alt="Logo" width={120} height={40} />
                </Link>
            </div>
            <div className={styles.authButtons}>
                        <Link href="/login" className={styles.loginButton}>
                            로그인
                        </Link>
                        <Link href="/signup" className={styles.signupButton}>
                            회원가입
                        </Link>
            </div>
        </header>
    );
};

export default Header;
