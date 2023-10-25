import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { toastify } from "../helper/toastHelper";
// import "./style.css";
// import { toastify } from "react-toastify";

export default function Auth() {
  const [tab, setTab] = useState(1);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log(`User logged in: ${userCredential.user}`);
        navigate("/main");
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
    if (password !== confirmPassword) {
      toastify("Passwords do not match.");
    } else {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;

          console.log("User ==>", user);

          // Create a formatted date string
          const formattedDate = new Date().toLocaleDateString("en-US");

          // Add user data to Firestore
          const userRef = doc(db, "users", user.uid);
          setDoc(userRef, {
            name: userName, // Replace with the actual user's name
            email: user.email,
            totalBalance: 100,
            createdAt: formattedDate,
          })
            .then(() => {
              console.log("User data added to Firestore");
              navigate("/main");
            })
            .catch((error) => {
              console.error("Error adding user data to Firestore:", error);
            });
        })
        .catch((error) => {
          let { message } = error;
          console.error(message);
          if (message.includes("email-already-in-use")) {
            toastify("Email already exists.");
          } else if (message.includes("weak-password")) {
            toastify("Password must be atleast 6 characters.");
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
          <div id="logo_wrapper" className="logo_wrapper">
            <img
              className="logo"
              src={require("../assets/images/logo.png")}
              alt="logo"
            />
          </div>

          <div className="fields">
            <input
              className="email_input"
              type="email"
              placeholder="Электронная почта"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="psw_input"
              type="password"
              placeholder="Пароль"
              name="psw"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="button" type="submit">
            Войти
          </button>

          <div className="signup_wrapper">
            <p className="sign_up">Нет аккаунта?</p>
            <a
              className="sign_up_link cursor-pointer"
              onClick={() => setTab(2)}
            >
              Зарегистрироваться
            </a>
          </div>
        </form>
      ) : (
        <form class="signup_form" onSubmit={handleSignUp}>
          <div id="signup_logo_wrapper" class="logo_wrapper">
            <img
              class="signup_logo"
              src={require("../assets/images/logo.png")}
              alt="logo"
            />
            <h3 class="signup_title">Регистрация</h3>
          </div>

          <div class="fields">
            <input
              class="name_input"
              type="text"
              placeholder="Имя"
              name="name"
              onChange={(e) => setUserName(e.target.value)}
              required
            />

            <input
              class="email_input"
              type="email"
              placeholder="Электронная почта"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              class="psw_input"
              type="password"
              placeholder="Пароль"
              name="psw"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              class="psw_input"
              type="password"
              placeholder="Повторите пароль"
              name="psw"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button class="button" type="submit">
            Зарегистрироваться
          </button>

          <div class="login_wrapper">
            <p class="login">Есть аккаунт?</p>
            <a class="login_link cursor-pointer" onClick={() => setTab(1)}>
              Войти
            </a>
          </div>
        </form>
      )}
    </>
  );
}
