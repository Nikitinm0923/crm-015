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
import { Dropdown } from "react-bootstrap";
import { getIPRange } from "../helper/helpers";
import { signOut } from "firebase/auth";
import { toastify } from "../helper/toastHelper";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import dark from "../assets/images/dark.png";
import languages from "../assets/flags/index";
import light from "../assets/images/light.png";
import purple from "../assets/images/purple.png";
import React, { useEffect, useState } from "react";

export default function Auth() {
  const { i18n } = useTranslation();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [tab, setTab] = useState(1);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("THEME") || "dark"
  );
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

  const changeLanguage = (lng) => {
    setSelectedLanguage(lng);
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  const changeTheme = (t) => {
    const root = document.querySelector("html");
    root.classList.remove(theme);
    if (t !== "dark") root.classList.add(t);
    setTheme(t);
    localStorage.setItem("THEME", t);
  };

  useEffect(() => {
    const root = document.getElementById("root");
    root.style.backgroundImage = `url(${
      theme === "purple" ? purple : theme === "light" ? light : dark
    })`;
    root.style.backgroundPosition = "center";
    root.style.backgroundRepeat = "no-repeat";
    root.style.backgroundSize = "cover";
  }, [theme]);

  return (
    <>
      {tab === 1 ? (
        <form className="login_form" id="loginForm" onSubmit={handleLogin}>
          <h1>Log in</h1>
          <div className="fields">
            <input
              className="email_input"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username or Email"
              required
              type="email"
              value={email}
            />
            <input
              className="psw_input"
              name="psw"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />
          </div>
          <button className="button" type="submit">
            Log in
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
                Continue with Google
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
                Continue with Apple
              </span>
            </button>
          </div>
          <div className="signup_wrapper">
            <hr className="signup_text" />
            <button className="sign_up_link" onClick={() => setTab(2)}>
              Sign Up
            </button>
          </div>
          <div className="flag_theme">
            <Dropdown>
              <Dropdown.Toggle className="flag_toggle" variant="">
                <img
                  alt={selectedLanguage}
                  height="auto"
                  src={languages[selectedLanguage]}
                  width={36}
                />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(languages)
                  .filter((lng) => lng !== selectedLanguage)
                  .map((lng, i) => (
                    <Dropdown.Item key={i} onClick={() => changeLanguage(lng)}>
                      <img
                        alt={lng}
                        height="auto"
                        src={languages[lng]}
                        width={40}
                      />
                    </Dropdown.Item>
                  ))}
              </Dropdown.Menu>
            </Dropdown>
            <svg
              height="36"
              style={{ stroke: "var(--separator-line-color)" }}
              viewBox="0 0 1 44"
              width="1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                opacity="0.61"
                x1="0.5"
                x2="0.499998"
                y1="2.18557e-08"
                y2="44"
              />
            </svg>
            <Dropdown>
              <Dropdown.Toggle className="theme_toggle" variant="">
                <svg
                  height="25"
                  style={{ fill: "var(--main-primary-button)" }}
                  viewBox="0 0 25 25"
                  width="25"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11.7131 12.9069C12.1237 13.3002 12.6132 13.6085 13.1517 13.813C13.6902 14.0175 14.2663 14.1138 14.8447 14.096C14.495 14.6511 13.9715 15.0849 13.3498 15.3347C12.728 15.5845 12.0401 15.6375 11.385 15.4861C10.73 15.3348 10.1418 14.9868 9.70502 14.4923C9.26827 13.9978 9.00558 13.3824 8.95482 12.7347C8.89448 12.1773 8.99787 11.6147 9.25321 11.1112C9.50854 10.6077 9.90553 10.1836 10.3989 9.8872C10.3936 10.4503 10.5074 11.0084 10.7333 11.5276C10.9593 12.0468 11.2927 12.5162 11.7131 12.9069ZM20.1007 12.5001C20.1016 13.5122 19.8956 14.5145 19.4944 15.4497C19.0932 16.3848 18.5047 17.2346 17.7626 17.9502C17.0204 18.6658 16.1392 19.2333 15.1694 19.6202C14.1996 20.0071 13.1602 20.2057 12.1107 20.2048C1.51017 19.8051 1.51017 5.19512 12.1107 4.79546C13.1602 4.79455 14.1996 4.99323 15.1694 5.3801C16.1392 5.76698 17.0204 6.33447 17.7626 7.05009C18.5047 7.76572 19.0932 8.61544 19.4944 9.55062C19.8956 10.4858 20.1016 11.4881 20.1007 12.5001ZM17.2963 13.1805C17.3132 13.0305 17.289 12.879 17.2262 12.7409C17.1634 12.6028 17.0641 12.483 16.9382 12.3935C16.8123 12.304 16.6643 12.2479 16.509 12.2308C16.3536 12.2137 16.1963 12.2362 16.0527 12.2961C15.5323 12.5244 14.9514 12.5922 14.3894 12.4903C13.8275 12.3883 13.3119 12.1214 12.9132 11.7262C12.4915 11.3479 12.201 10.8535 12.0811 10.3103C11.9612 9.76707 12.0177 9.20142 12.243 8.69028C12.3023 8.54947 12.3219 8.39601 12.2997 8.24553C12.2775 8.09505 12.2143 7.95293 12.1166 7.83366C12.0189 7.71439 11.8902 7.62223 11.7435 7.56656C11.5968 7.5109 11.4375 7.49372 11.2817 7.51679C9.98028 7.70298 8.8024 8.36306 7.99038 9.36122C7.17836 10.3594 6.79396 11.6197 6.91628 12.8828C7.32902 18.6298 16.1527 19.3971 17.2963 13.1805ZM12.9926 3.00531V1.67241C12.9891 1.44904 12.8947 1.23594 12.7297 1.07915C12.5647 0.922363 12.3423 0.834473 12.1107 0.834473C11.879 0.834473 11.6566 0.922363 11.4916 1.07915C11.3266 1.23594 11.2322 1.44904 11.2288 1.67241V3.00528C11.2322 3.22865 11.3266 3.44175 11.4916 3.59854C11.6566 3.75533 11.879 3.84323 12.1106 3.84323C12.3423 3.84324 12.5647 3.75535 12.7297 3.59856C12.8947 3.44178 12.9891 3.22868 12.9926 3.00531ZM12.9926 23.3279V21.995C12.9891 21.7716 12.8947 21.5585 12.7297 21.4017C12.5647 21.2449 12.3423 21.157 12.1107 21.157C11.879 21.157 11.6566 21.2449 11.4916 21.4017C11.3266 21.5585 11.2322 21.7716 11.2288 21.995V23.3278C11.2322 23.5512 11.3266 23.7643 11.4916 23.9211C11.6566 24.0779 11.879 24.1658 12.1106 24.1658C12.3423 24.1658 12.5647 24.0779 12.7297 23.9211C12.8947 23.7643 12.9891 23.5512 12.9926 23.3279ZM19.6968 6.38701L20.6743 5.44525C20.8339 5.28465 20.9218 5.07016 20.9194 4.84777C20.9169 4.62537 20.8242 4.41275 20.6611 4.25549C20.498 4.09822 20.2775 4.00882 20.0468 4.00644C19.8162 4.00407 19.5938 4.0889 19.4272 4.24277L18.4498 5.18448C18.29 5.34505 18.2019 5.5596 18.2043 5.78209C18.2067 6.00459 18.2994 6.21732 18.4626 6.37466C18.6258 6.53199 18.8464 6.62141 19.0771 6.62372C19.3078 6.62603 19.5303 6.54105 19.6968 6.38701ZM4.79405 20.7576L5.77155 19.8158C5.93143 19.6552 6.01966 19.4407 6.01731 19.2181C6.01496 18.9955 5.92222 18.7827 5.759 18.6253C5.59577 18.4679 5.37506 18.3785 5.14425 18.3763C4.91343 18.374 4.6909 18.4591 4.52442 18.6133L3.54695 19.555C3.38703 19.7156 3.29875 19.9302 3.30107 20.1528C3.30339 20.3754 3.39612 20.5882 3.55936 20.7456C3.7226 20.903 3.94334 20.9924 4.17418 20.9947C4.40503 20.9969 4.62757 20.9118 4.79405 20.7576ZM24.2213 12.5001C24.2214 12.3885 24.1986 12.2779 24.1543 12.1747C24.11 12.0715 24.045 11.9777 23.9631 11.8987C23.8812 11.8198 23.784 11.7571 23.677 11.7144C23.5699 11.6717 23.4552 11.6497 23.3394 11.6497H21.9576C21.7237 11.6497 21.4994 11.7393 21.334 11.8988C21.1686 12.0583 21.0757 12.2746 21.0757 12.5001C21.0757 12.7257 21.1686 12.942 21.334 13.1015C21.4994 13.261 21.7237 13.3506 21.9576 13.3506H23.3394C23.4552 13.3506 23.5699 13.3286 23.677 13.2859C23.784 13.2432 23.8812 13.1805 23.9631 13.1015C24.045 13.0226 24.11 12.9288 24.1543 12.8256C24.1986 12.7224 24.2214 12.6118 24.2213 12.5001ZM3.14565 12.5001C3.14568 12.3885 3.12289 12.2779 3.07858 12.1747C3.03427 12.0715 2.96932 11.9777 2.88742 11.8987C2.80552 11.8198 2.70829 11.7571 2.60127 11.7144C2.49426 11.6717 2.37957 11.6497 2.26375 11.6497H0.881904C0.648008 11.6497 0.423693 11.7393 0.258304 11.8988C0.0929146 12.0583 0 12.2746 0 12.5001C0 12.7257 0.0929146 12.942 0.258304 13.1015C0.423693 13.261 0.648008 13.3506 0.881904 13.3506H2.26375C2.37957 13.3506 2.49426 13.3286 2.60127 13.2859C2.70829 13.2432 2.80552 13.1805 2.88742 13.1015C2.96932 13.0226 3.03427 12.9288 3.07858 12.8256C3.12289 12.7224 3.14568 12.6118 3.14565 12.5001ZM20.6748 20.7576C20.84 20.598 20.9328 20.3817 20.9328 20.1562C20.9327 19.9307 20.8397 19.7145 20.6743 19.555L19.6968 18.6133C19.615 18.5343 19.5178 18.4717 19.4108 18.4289C19.3038 18.3862 19.1891 18.3642 19.0733 18.3642C18.9575 18.3642 18.8428 18.3862 18.7359 18.4289C18.6289 18.4717 18.5317 18.5343 18.4498 18.6133C18.3679 18.6922 18.3029 18.786 18.2586 18.8891C18.2143 18.9923 18.1915 19.1029 18.1915 19.2145C18.1915 19.3262 18.2143 19.4368 18.2586 19.5399C18.3029 19.6431 18.3679 19.7368 18.4498 19.8158L19.4273 20.7576C19.5092 20.8365 19.6064 20.8992 19.7135 20.942C19.8205 20.9847 19.9352 21.0067 20.051 21.0067C20.1669 21.0067 20.2816 20.9847 20.3886 20.942C20.4956 20.8992 20.5929 20.8365 20.6748 20.7576ZM5.77198 6.38701C5.93725 6.22747 6.03005 6.01117 6.02996 5.78566C6.02988 5.56016 5.93693 5.34392 5.77155 5.18448L4.79405 4.24272C4.71217 4.16376 4.61496 4.10113 4.50798 4.0584C4.40099 4.01567 4.28632 3.99367 4.17052 3.99367C4.05472 3.99367 3.94005 4.01567 3.83307 4.0584C3.72608 4.10113 3.62887 4.16376 3.54699 4.24272C3.4651 4.32168 3.40015 4.41542 3.35584 4.51859C3.31152 4.62175 3.28871 4.73232 3.28871 4.84399C3.28871 4.95565 3.31152 5.06623 3.35584 5.16939C3.40015 5.27256 3.4651 5.36629 3.54699 5.44525L4.52449 6.38701C4.6064 6.466 4.70364 6.52866 4.81066 6.5714C4.91769 6.61415 5.03239 6.63615 5.14823 6.63615C5.26407 6.63615 5.37878 6.61415 5.4858 6.5714C5.59283 6.52866 5.69007 6.466 5.77198 6.38701Z" />
                </svg>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {["Dark", "Light", "Purple"].map((t, i) => (
                  <Dropdown.Item
                    key={i}
                    onClick={() => changeTheme(t.toLowerCase())}
                  >
                    {t}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </form>
      ) : (
        <form className="signup_form" onSubmit={handleSignUp}>
          <h1 className="signup_title">Sign Up</h1>
          <div className="fields">
            <input
              className="name_input"
              name="name"
              onChange={(e) =>
                setSignUpFormData({ ...signUpFormData, name: e.target.value })
              }
              placeholder="Name"
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
              placeholder="Surname"
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
              placeholder="Email"
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
              placeholder="Password"
              required
              type="password"
              value={signUpFormData.password}
            />
            <input
              className="psw_input"
              name="confirm_password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat Password"
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
              placeholder="Phone"
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
              placeholder="Country"
              type="text"
              value={signUpFormData.country}
            />
            <input
              className="psw_input"
              name="city"
              onChange={(e) =>
                setSignUpFormData({ ...signUpFormData, city: e.target.value })
              }
              placeholder="City"
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
              placeholder="Referral Code"
              type="text"
              value={signUpFormData.refCode}
            />
          </div>
          <button className="button" type="submit">
            Sign Up
          </button>
          <div className="login_wrapper" style={{ marginTop: "16px" }}>
            <hr className="login_text" />
            <button className="login_link " onClick={() => setTab(1)}>
              Log in
            </button>
          </div>
          <div className="flag_theme">
            <Dropdown>
              <Dropdown.Toggle className="flag_toggle" variant="">
                <img
                  alt={selectedLanguage}
                  height="auto"
                  src={languages[selectedLanguage]}
                  width={36}
                />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(languages)
                  .filter((lng) => lng !== selectedLanguage)
                  .map((lng, i) => (
                    <Dropdown.Item key={i} onClick={() => changeLanguage(lng)}>
                      <img
                        alt={lng}
                        height="auto"
                        src={languages[lng]}
                        width={40}
                      />
                    </Dropdown.Item>
                  ))}
              </Dropdown.Menu>
            </Dropdown>
            <svg
              height="36"
              style={{ stroke: "var(--separator-line-color)" }}
              viewBox="0 0 1 44"
              width="1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                opacity="0.61"
                x1="0.5"
                x2="0.499998"
                y1="2.18557e-08"
                y2="44"
              />
            </svg>
            <Dropdown>
              <Dropdown.Toggle className="theme_toggle" variant="">
                <svg
                  height="25"
                  style={{ fill: "var(--main-primary-button)" }}
                  viewBox="0 0 25 25"
                  width="25"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11.7131 12.9069C12.1237 13.3002 12.6132 13.6085 13.1517 13.813C13.6902 14.0175 14.2663 14.1138 14.8447 14.096C14.495 14.6511 13.9715 15.0849 13.3498 15.3347C12.728 15.5845 12.0401 15.6375 11.385 15.4861C10.73 15.3348 10.1418 14.9868 9.70502 14.4923C9.26827 13.9978 9.00558 13.3824 8.95482 12.7347C8.89448 12.1773 8.99787 11.6147 9.25321 11.1112C9.50854 10.6077 9.90553 10.1836 10.3989 9.8872C10.3936 10.4503 10.5074 11.0084 10.7333 11.5276C10.9593 12.0468 11.2927 12.5162 11.7131 12.9069ZM20.1007 12.5001C20.1016 13.5122 19.8956 14.5145 19.4944 15.4497C19.0932 16.3848 18.5047 17.2346 17.7626 17.9502C17.0204 18.6658 16.1392 19.2333 15.1694 19.6202C14.1996 20.0071 13.1602 20.2057 12.1107 20.2048C1.51017 19.8051 1.51017 5.19512 12.1107 4.79546C13.1602 4.79455 14.1996 4.99323 15.1694 5.3801C16.1392 5.76698 17.0204 6.33447 17.7626 7.05009C18.5047 7.76572 19.0932 8.61544 19.4944 9.55062C19.8956 10.4858 20.1016 11.4881 20.1007 12.5001ZM17.2963 13.1805C17.3132 13.0305 17.289 12.879 17.2262 12.7409C17.1634 12.6028 17.0641 12.483 16.9382 12.3935C16.8123 12.304 16.6643 12.2479 16.509 12.2308C16.3536 12.2137 16.1963 12.2362 16.0527 12.2961C15.5323 12.5244 14.9514 12.5922 14.3894 12.4903C13.8275 12.3883 13.3119 12.1214 12.9132 11.7262C12.4915 11.3479 12.201 10.8535 12.0811 10.3103C11.9612 9.76707 12.0177 9.20142 12.243 8.69028C12.3023 8.54947 12.3219 8.39601 12.2997 8.24553C12.2775 8.09505 12.2143 7.95293 12.1166 7.83366C12.0189 7.71439 11.8902 7.62223 11.7435 7.56656C11.5968 7.5109 11.4375 7.49372 11.2817 7.51679C9.98028 7.70298 8.8024 8.36306 7.99038 9.36122C7.17836 10.3594 6.79396 11.6197 6.91628 12.8828C7.32902 18.6298 16.1527 19.3971 17.2963 13.1805ZM12.9926 3.00531V1.67241C12.9891 1.44904 12.8947 1.23594 12.7297 1.07915C12.5647 0.922363 12.3423 0.834473 12.1107 0.834473C11.879 0.834473 11.6566 0.922363 11.4916 1.07915C11.3266 1.23594 11.2322 1.44904 11.2288 1.67241V3.00528C11.2322 3.22865 11.3266 3.44175 11.4916 3.59854C11.6566 3.75533 11.879 3.84323 12.1106 3.84323C12.3423 3.84324 12.5647 3.75535 12.7297 3.59856C12.8947 3.44178 12.9891 3.22868 12.9926 3.00531ZM12.9926 23.3279V21.995C12.9891 21.7716 12.8947 21.5585 12.7297 21.4017C12.5647 21.2449 12.3423 21.157 12.1107 21.157C11.879 21.157 11.6566 21.2449 11.4916 21.4017C11.3266 21.5585 11.2322 21.7716 11.2288 21.995V23.3278C11.2322 23.5512 11.3266 23.7643 11.4916 23.9211C11.6566 24.0779 11.879 24.1658 12.1106 24.1658C12.3423 24.1658 12.5647 24.0779 12.7297 23.9211C12.8947 23.7643 12.9891 23.5512 12.9926 23.3279ZM19.6968 6.38701L20.6743 5.44525C20.8339 5.28465 20.9218 5.07016 20.9194 4.84777C20.9169 4.62537 20.8242 4.41275 20.6611 4.25549C20.498 4.09822 20.2775 4.00882 20.0468 4.00644C19.8162 4.00407 19.5938 4.0889 19.4272 4.24277L18.4498 5.18448C18.29 5.34505 18.2019 5.5596 18.2043 5.78209C18.2067 6.00459 18.2994 6.21732 18.4626 6.37466C18.6258 6.53199 18.8464 6.62141 19.0771 6.62372C19.3078 6.62603 19.5303 6.54105 19.6968 6.38701ZM4.79405 20.7576L5.77155 19.8158C5.93143 19.6552 6.01966 19.4407 6.01731 19.2181C6.01496 18.9955 5.92222 18.7827 5.759 18.6253C5.59577 18.4679 5.37506 18.3785 5.14425 18.3763C4.91343 18.374 4.6909 18.4591 4.52442 18.6133L3.54695 19.555C3.38703 19.7156 3.29875 19.9302 3.30107 20.1528C3.30339 20.3754 3.39612 20.5882 3.55936 20.7456C3.7226 20.903 3.94334 20.9924 4.17418 20.9947C4.40503 20.9969 4.62757 20.9118 4.79405 20.7576ZM24.2213 12.5001C24.2214 12.3885 24.1986 12.2779 24.1543 12.1747C24.11 12.0715 24.045 11.9777 23.9631 11.8987C23.8812 11.8198 23.784 11.7571 23.677 11.7144C23.5699 11.6717 23.4552 11.6497 23.3394 11.6497H21.9576C21.7237 11.6497 21.4994 11.7393 21.334 11.8988C21.1686 12.0583 21.0757 12.2746 21.0757 12.5001C21.0757 12.7257 21.1686 12.942 21.334 13.1015C21.4994 13.261 21.7237 13.3506 21.9576 13.3506H23.3394C23.4552 13.3506 23.5699 13.3286 23.677 13.2859C23.784 13.2432 23.8812 13.1805 23.9631 13.1015C24.045 13.0226 24.11 12.9288 24.1543 12.8256C24.1986 12.7224 24.2214 12.6118 24.2213 12.5001ZM3.14565 12.5001C3.14568 12.3885 3.12289 12.2779 3.07858 12.1747C3.03427 12.0715 2.96932 11.9777 2.88742 11.8987C2.80552 11.8198 2.70829 11.7571 2.60127 11.7144C2.49426 11.6717 2.37957 11.6497 2.26375 11.6497H0.881904C0.648008 11.6497 0.423693 11.7393 0.258304 11.8988C0.0929146 12.0583 0 12.2746 0 12.5001C0 12.7257 0.0929146 12.942 0.258304 13.1015C0.423693 13.261 0.648008 13.3506 0.881904 13.3506H2.26375C2.37957 13.3506 2.49426 13.3286 2.60127 13.2859C2.70829 13.2432 2.80552 13.1805 2.88742 13.1015C2.96932 13.0226 3.03427 12.9288 3.07858 12.8256C3.12289 12.7224 3.14568 12.6118 3.14565 12.5001ZM20.6748 20.7576C20.84 20.598 20.9328 20.3817 20.9328 20.1562C20.9327 19.9307 20.8397 19.7145 20.6743 19.555L19.6968 18.6133C19.615 18.5343 19.5178 18.4717 19.4108 18.4289C19.3038 18.3862 19.1891 18.3642 19.0733 18.3642C18.9575 18.3642 18.8428 18.3862 18.7359 18.4289C18.6289 18.4717 18.5317 18.5343 18.4498 18.6133C18.3679 18.6922 18.3029 18.786 18.2586 18.8891C18.2143 18.9923 18.1915 19.1029 18.1915 19.2145C18.1915 19.3262 18.2143 19.4368 18.2586 19.5399C18.3029 19.6431 18.3679 19.7368 18.4498 19.8158L19.4273 20.7576C19.5092 20.8365 19.6064 20.8992 19.7135 20.942C19.8205 20.9847 19.9352 21.0067 20.051 21.0067C20.1669 21.0067 20.2816 20.9847 20.3886 20.942C20.4956 20.8992 20.5929 20.8365 20.6748 20.7576ZM5.77198 6.38701C5.93725 6.22747 6.03005 6.01117 6.02996 5.78566C6.02988 5.56016 5.93693 5.34392 5.77155 5.18448L4.79405 4.24272C4.71217 4.16376 4.61496 4.10113 4.50798 4.0584C4.40099 4.01567 4.28632 3.99367 4.17052 3.99367C4.05472 3.99367 3.94005 4.01567 3.83307 4.0584C3.72608 4.10113 3.62887 4.16376 3.54699 4.24272C3.4651 4.32168 3.40015 4.41542 3.35584 4.51859C3.31152 4.62175 3.28871 4.73232 3.28871 4.84399C3.28871 4.95565 3.31152 5.06623 3.35584 5.16939C3.40015 5.27256 3.4651 5.36629 3.54699 5.44525L4.52449 6.38701C4.6064 6.466 4.70364 6.52866 4.81066 6.5714C4.91769 6.61415 5.03239 6.63615 5.14823 6.63615C5.26407 6.63615 5.37878 6.61415 5.4858 6.5714C5.59283 6.52866 5.69007 6.466 5.77198 6.38701Z" />
                </svg>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {["Dark", "Light", "Purple"].map((t, i) => (
                  <Dropdown.Item
                    key={i}
                    onClick={() => changeTheme(t.toLowerCase())}
                  >
                    {t}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </form>
      )}
    </>
  );
}
