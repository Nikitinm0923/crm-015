import {
  addPlayerLogs,
  getBlockedIPs,
  updateOnlineStatus,
} from "../helper/firebaseHelpers";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getIPRange } from "../helper/helpers";
import { signOut } from "firebase/auth";
import { toastify } from "../helper/toastHelper";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FlagNTheme from "./FlagNTheme";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Auth() {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState(1);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [signUpFormData, setSignUpFormData] = useState({
    city: "",
    country: "",
    email: "",
    name: "",
    password: "",
    phone: "",
    refCode: "",
    surname: "",
  });

  function generateRandomCode(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    return code;
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    const [ip, blockedIps] = await Promise.all([
      axios.get("https://api.ipify.org").then((res) => res.data),
      getBlockedIPs(),
    ]);

    for (let { firstIp, secondIp } of blockedIps) {
      if (ip === firstIp || ip === secondIp) return toastify("Unable to login");
      const ipRange = getIPRange(firstIp, secondIp);
      if (ipRange.includes(ip)) return toastify("Unable to login");
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        await updateOnlineStatus(userCredential?.user?.uid, true);
        await addPlayerLogs("Logged in", userCredential?.user?.uid);
        localStorage.setItem("USER", JSON.stringify(userCredential));
        window.location.href = "/";
      })
      .catch((error) => {
        const { message } = error;
        console.error(message);
        if (message?.includes("invalid-login-credentials")) {
          toastify("Invalid Email or Password");
        } else if (message.includes("invalid-email")) {
          toastify("Invalid Email");
        } else {
          toastify(message);
        }
      });
  };

  const handleSignUp = (e) => {
    e.preventDefault();

    if (signUpFormData.password !== confirmPassword) {
      toastify("Password does not match");
    } else {
      createUserWithEmailAndPassword(
        auth,
        signUpFormData.email,
        signUpFormData.password
      )
        .then((userCredential) => {
          const user = userCredential.user;
          const userRef = doc(db, "users", user.uid);
          setDoc(userRef, {
            city: signUpFormData.city || "",
            country: signUpFormData.country || "",
            createdAt: serverTimestamp(),
            email: user.email,
            isUserEdited: false,
            name: signUpFormData.name,
            onlineStatus: false,
            password: signUpFormData.password,
            phone: signUpFormData.phone || "",
            refCode: generateRandomCode(8),
            role: "user",
            status: "Xsd9VUhM2geOW8w8HDsI",
            surname: signUpFormData.surname,
            useRefCode: signUpFormData.refCode || "",
          })
            .then(() => {
              toastify("Account created successfully", "success");
              setSignUpFormData({
                city: "",
                country: "",
                email: "",
                name: "",
                password: "",
                phone: "",
                refCode: "",
                surname: "",
              });
              setConfirmPassword("");
              setTab(1);
              signOut(auth)
                .then(() => {
                  navigate("/");
                })
                .catch((error) => {
                  console.error("Failed to sign out: ", error);
                });
            })
            .catch((error) => {
              console.error("Failed to create user: ", error);
            });
        })
        .catch((error) => {
          let { message } = error;
          console.error(message);
          if (message.includes("email-already-in-use")) {
            toastify("Email already exists");
          } else if (message.includes("weak-password")) {
            toastify("Password must be at least 6 characters");
          } else {
            toastify(message);
          }
        });
    }
  };

  return (
    <>
      {tab === 1 ? (
        <form className="login_form" id="loginForm" onSubmit={handleLogin}>
          <h1>{t("logIn")}</h1>
          <div className="fields">
            <input
              className="email_input"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("usernameOrEmail")}
              required
              type="email"
              value={email}
            />
            <input
              className="psw_input"
              name="psw"
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              required
              type="password"
              value={password}
            />
          </div>
          <button className="button" type="submit">
            {t("logIn")}
          </button>
          <br />
          <hr className="or_text" />
          <br />
          <div className="login_other mb-10">
            <button
              className="d-flex align-items-center w-100"
              style={{
                backgroundColor: "#4285F4",
                border: "none",
                borderRadius: "5px",
                margin: "8px 0",
                padding: "8px 0",
              }}
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              <div
                style={{
                  backgroundColor: "transparent",
                  left: "20%",
                  position: "absolute",
                }}
              >
                <img
                  alt=""
                  height={20}
                  src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Search_GSA.original.png"
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "5px",
                  }}
                />
              </div>
              <span
                style={{
                  backgroundColor: "transparent",
                  color: "#fff",
                  width: "100%",
                }}
              >
                {t("continueWithGoogle")}
              </span>
            </button>
            <button
              className="d-flex align-items-center w-100"
              style={{
                backgroundColor: "#fff",
                border: "1px solid #000",
                borderRadius: "5px",
                margin: "8px 0",
                padding: "8px 0",
              }}
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              <div
                style={{
                  backgroundColor: "transparent",
                  left: "20%",
                  position: "absolute",
                }}
              >
                <img
                  alt=""
                  height={20}
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/625px-Apple_logo_black.svg.png"
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "5px",
                  }}
                  width="auto"
                />
              </div>
              <span
                style={{
                  backgroundColor: "transparent",
                  color: "#000",
                  width: "100%",
                }}
              >
                {t("continueWithApple")}
              </span>
            </button>
          </div>
          <div className="signup_wrapper">
            {/* <hr className="signup_text" /> */}
            <div className="signup_text">
              <p>{t("dontHaveAccount")}</p>
            </div>
            <button className="sign_up_link" onClick={() => setTab(2)}>
              {t("signUp")}
            </button>
          </div>
          <FlagNTheme />
        </form>
      ) : (
        <form className="signup_form" onSubmit={handleSignUp}>
          <h1 className="signup_title">{t("signUp")}</h1>
          <div className="fields">
            <input
              className="name_input"
              name="name"
              onChange={(e) =>
                setSignUpFormData({ ...signUpFormData, name: e.target.value })
              }
              placeholder={t("name")}
              required
              type="text"
              value={signUpFormData.name}
            />
            <input
              className="name_input"
              name="surname"
              onChange={(e) =>
                setSignUpFormData({
                  ...signUpFormData,
                  surname: e.target.value,
                })
              }
              placeholder={t("surname")}
              required
              type="text"
              value={signUpFormData.surname}
            />
            <input
              className="email_input"
              name="email"
              onChange={(e) =>
                setSignUpFormData({ ...signUpFormData, email: e.target.value })
              }
              placeholder={t("email")}
              required
              type="email"
              value={signUpFormData.email}
            />
            <input
              className="psw_input"
              name="password"
              onChange={(e) =>
                setSignUpFormData({
                  ...signUpFormData,
                  password: e.target.value,
                })
              }
              placeholder={t("password")}
              required
              type="password"
              value={signUpFormData.password}
            />
            <input
              className="psw_input"
              name="confirm_password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirmPassword")}
              required
              type="password"
              value={confirmPassword}
            />
            <input
              className="psw_input"
              name="phone"
              onChange={(e) =>
                setSignUpFormData({ ...signUpFormData, phone: e.target.value })
              }
              placeholder={t("phone")}
              type="tel"
              value={signUpFormData.phone}
            />
            <input
              className="psw_input"
              name="country"
              onChange={(e) =>
                setSignUpFormData({
                  ...signUpFormData,
                  country: e.target.value,
                })
              }
              placeholder={t("country")}
              type="text"
              value={signUpFormData.country}
            />
            <input
              className="psw_input"
              name="city"
              onChange={(e) =>
                setSignUpFormData({ ...signUpFormData, city: e.target.value })
              }
              placeholder={t("city")}
              type="text"
              value={signUpFormData.city}
            />
            <input
              className="psw_input"
              name="refCode"
              onChange={(e) =>
                setSignUpFormData({
                  ...signUpFormData,
                  refCode: e.target.value,
                })
              }
              placeholder={t("referralCode")}
              type="text"
              value={signUpFormData.refCode}
            />
          </div>
          <button className="button" type="submit">
            {t("signUp")}
          </button>
          <div className="login_wrapper" style={{ marginTop: "16px" }}>
            {/* <hr className="login_text" /> */}
            <div className="login_text">
              <p>{t("doYouHaveAccount")}</p>
            </div>
            <button className="login_link " onClick={() => setTab(1)}>
              {t("logIn")}
            </button>
          </div>
          <FlagNTheme />
        </form>
      )}
    </>
  );
}
