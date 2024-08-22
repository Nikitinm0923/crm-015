import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { convertTimestamptToDate } from "./helpers";
import { toastify } from "./toastHelper";
import { updatePassword, signInWithEmailAndPassword } from "firebase/auth";

export const fetchAllOrdersByUserId = (userId, setState) => {
  if (!userId) return;
  try {
    const q = query(
      collection(db, "orders"),
      orderBy("createdTime", "desc"),
      where("userId", "==", userId)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const orders = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        orders.push({
          id: doc.id,
          ...docData,
          createdTime: convertTimestamptToDate(docData.createdTime),
        });
      });
      setState(orders);
    });
    return () => unsubscribe();
  } catch (error) {
    console.error("Error fetching orders: ", error);
  }
};

export const updateOnlineStatus = async (userId, newStatus) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { onlineStatus: newStatus });
  } catch (error) {
    console.error(error);
  }
};

export const updateUserById = async (id, payload) => {
  const userDocRef = doc(db, "users", id);
  await updateDoc(userDocRef, payload);
};

export const getUserData = async (userId) => {
  try {
    let data = {};
    const q = collection(db, "users", where("docId", "==", userId));
    const snapshot = await getDoc(q);
    if (snapshot.empty) {
      return;
    }
    snapshot.forEach((doc) => {
      data = doc.data;
    });
    return data;
  } catch (error) {
    console.error(error);
  }
};

export const getColumnsById = async (id, setState) => {
  try {
    const userDocRef = doc(db, "columns", id);
    const columnDocSnapshot = await getDoc(userDocRef);
    if (columnDocSnapshot.exists()) {
      const columnData = columnDocSnapshot.data();
      setState(columnData.dealsColumns);
    }
  } catch (error) {
    console.error("Error fetching column: ", error);
  }
};

export const updateShowColumnsById = async (id, payload) => {
  const columnDocRef = doc(db, "columns", id);
  await setDoc(columnDocRef, payload, { merge: true });
};

export const getData = (collectionName) => {
  return new Promise((resolve, reject) => {
    try {
      const dataCollection = collection(db, collectionName);
      const unsubscribe = onSnapshot(
        dataCollection,
        (querySnapshot) => {
          const result = [];
          querySnapshot.forEach((doc) => {
            result.push(doc.data());
          });
          resolve(result);
        },
        (error) => {
          console.error("Error fetching data:", error);
          reject(error);
        }
      );
    } catch (error) {
      console.error("Error: ", error);
      reject(error);
    }
  });
};

export const getSymbolValue = (symbol) => {
  return new Promise((resolve, reject) => {
    try {
      const symbolsCollection = collection(db, "symbols");
      const q = query(symbolsCollection, where("symbol", "==", symbol.value));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let price = null;
        querySnapshot.forEach((doc) => {
          price = doc.data().price;
        });
        const parsePrice = parseFloat(price);
        resolve(parsePrice);
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const addQuotesToUser = async (userId, symbols) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { quotes: symbols });
    return true;
  } catch (error) {
    console.error(error);
  }
};

export const addUserNewBalance = async (userId, amount) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnapshot = await getDoc(userDocRef);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      const currentBalanceString = userData.totalBalance || 0;
      const currentBalance = parseFloat(currentBalanceString);
      const updatedBalance = currentBalance + parseFloat(amount);
      await setDoc(
        userDocRef,
        { totalBalance: updatedBalance },
        { merge: true }
      );
      const depositRef = collection(db, "deposits");
      await addDoc(depositRef, {
        userId: userId,
        amount: parseFloat(amount),
        comment: "Bonus",
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error updating balance: ", error);
  }
};

export const getAllSymbols = (setState) => {
  const symbolsRef = collection(db, "symbols");
  const unsubscribe = onSnapshot(
    symbolsRef,
    (snapshot) => {
      const realSymbols = [],
        duplicateSymbols = [];
      snapshot.forEach((doc) => {
        const symbol = { id: doc.id, ...doc.data() };
        symbol.duplicate
          ? duplicateSymbols.push(symbol)
          : realSymbols.push(symbol);
      });
      const symbolsData = realSymbols
        .map((s) => {
          return s.duplicates?.length
            ? [
                s,
                ...s.duplicates.map((d) =>
                  duplicateSymbols.find(({ id }) => id === d)
                ),
              ]
            : s;
        })
        .flat();
      setState(realSymbols);
    },
    (error) => {
      console.error("Error fetching data: ", error);
    }
  );
  return unsubscribe;
};

export const getDepositsByUser = (userId, setState) => {
  try {
    const depositsRef = collection(db, "deposits");
    const userDepositsQuery = query(
      depositsRef,
      orderBy("createdAt", "desc"),
      where("userId", "==", userId)
    );
    const unsubscribe = onSnapshot(
      userDepositsQuery,
      (snapshot) => {
        const depositsData = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          depositsData.push({
            id: doc.id,
            ...docData,
            createdAt: convertTimestamptToDate(docData.createdAt),
          });
        });
        setState(depositsData);
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );
    return () => unsubscribe();
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const getAllBonus = (userId, setState) => {
  try {
    const depositsRef = collection(db, "deposits");
    const userDepositsQuery = query(
      depositsRef,
      where("userId", "==", userId),
      where("type", "==", "Bonus")
    );
    const unsubscribe = onSnapshot(
      userDepositsQuery,
      (snapshot) => {
        const depositsData = [];
        snapshot.forEach((doc) => {
          depositsData.push({ id: doc.id, ...doc.data() });
        });
        const allBonus = depositsData.reduce(
          (p, v) => p + parseFloat(v.sum),
          0
        );
        setState(allBonus);
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );
    return () => unsubscribe();
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const deleteDocument = async (collectionPath, documentId) => {
  const documentRef = doc(db, collectionPath, documentId);
  await deleteDoc(documentRef);
};

export const getSymbolPriceHistory = async (id, setState) => {
  try {
    const symbolDocRef = doc(db, "symbols", id);
    const priceHistoryCollectionRef = collection(symbolDocRef, "priceHistory");
    const daysDocs = (
      await getDocs(
        query(priceHistoryCollectionRef, orderBy("updatedAt", "desc"), limit(2))
      )
    ).docs;
    if (!daysDocs.length) return;
    let prevDayData = [];
    let includePrevData = false;
    const hourCollectionRef = collection(daysDocs[0].ref, "hours");
    const unsubscribe = onSnapshot(
      hourCollectionRef,
      (hourSnaps) => {
        let chartData = [];
        hourSnaps.forEach((hourSnap) => {
          chartData[hourSnap.id] = hourSnap.data()?.data || [];
        });
        chartData = chartData.filter((d) => d);
        if (includePrevData) {
          includePrevData = false;
          setState([...prevDayData, ...chartData]);
          prevDayData = [];
        } else {
          setState(
            Object.values(chartData)
              .map((o) => Object.values(o))
              .flat(2)
          );
        }
      },
      (error) => {
        console.error("Error: ", error.message);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error("Error in getting priceHistory document: ", error.message);
  }
};

export const getSymbolPriceHistoryInAir = async ({
  id,
  date,
  setState,
  dataGroup,
  setLoading,
  isTimeframeClick,
}) => {
  try {
    const symbolDocRef = doc(db, "symbols", id);
    const priceHistoryCollectionRef = collection(symbolDocRef, "priceHistory");
    const daysSnap = await getDocs(
      query(priceHistoryCollectionRef, orderBy("updatedAt", "desc"))
    );
    if (daysSnap.empty) return;
    const prevDates = [];
    daysSnap.forEach((day) => prevDates.push({ id: day.id, ref: day.ref }));
    const timeframe = dataGroup.flat().reverse().join("");
    const daysSlice =
      timeframe === "1minute"
        ? 2
        : timeframe === "15minute"
        ? 3
        : timeframe === "1hour"
        ? 4
        : timeframe === "4hour"
        ? 6
        : timeframe === "1day"
        ? 8
        : timeframe === "1week"
        ? 16
        : 3;
    const requireDates = prevDates
      .filter((day) => day.id < date)
      .slice(0, daysSlice);
    let data = [];
    const promises = requireDates.map(async (requireDate) => {
      if (requireDate && requireDate.ref) {
        return getDocs(collection(requireDate.ref, "hours"));
      }
    });
    const prevDaySnapshot = await Promise.all(promises);
    prevDaySnapshot.forEach((prevDaySnapshot) => {
      let prevDayData = [];
      prevDaySnapshot.forEach((snap) => {
        prevDayData[snap.id] = snap.data()?.data || [];
      });
      data = [
        ...Object.values(prevDayData.filter((d) => d))
          .map((o) => Object.values(o))
          .flat(2),
        ...data,
      ];
    });
    setLoading(false);
    setState(data, true, timeframe, isTimeframeClick);
  } catch (error) {
    setLoading(false);
    console.error("Error in getting priceHistory document: ", error);
  }
};

export async function getDocument(collectionPath, documentId) {
  try {
    const docRef = doc(db, collectionPath, documentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error fetching document: ", error.message);
  }
}

export async function updateDocument(id, collectionPath, payload) {
  try {
    const docRef = doc(db, collectionPath, id);
    await updateDoc(docRef, payload);
  } catch (error) {
    console.error("Error updating document: ", error.message);
  }
}

export const getBlockedIPs = async () => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "blockedIps"), where("isBlocked", "==", true))
    );
    const blockedIPs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return blockedIPs;
  } catch (error) {
    console.error("Error while getting blocked ips.");
  }
};

export const incrementLastAccountNo = async () => {
  const { lastAccountNo } = await getDocument(
    "configs",
    "8VaY8WzBNUl6Ca8KbpWD"
  );
  await updateDocument("8VaY8WzBNUl6Ca8KbpWD", "configs", {
    lastAccountNo: +lastAccountNo + 1,
  });
};

export const getAssetGroups = (setState) => {
  try {
    const assetGroupsRef = collection(db, "assetGroups");
    const unsubscribe = onSnapshot(
      assetGroupsRef,
      (snapshot) => {
        const assetGroupsData = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          assetGroupsData.push({
            id: doc.id,
            ...docData,
          });
        });
        setState(assetGroupsData);
      },
      (error) => {
        console.error("Error fetching asset groups data: ", error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const addPlayerLogs = async (action, userId) => {
  return await addDoc(collection(db, "playerLogs"), {
    action: action,
    date: serverTimestamp(),
    userId: userId,
  });
};

export const changeUserPassword = (currPass, newPass) => {
  const userCredential = JSON.parse(localStorage.getItem("USER"));
  const email = userCredential.user.email;
  if (email) {
    signInWithEmailAndPassword(auth, email, currPass)
      .then((userCredential) => {
        updatePassword(userCredential.user, newPass).then(() => {
          toastify("Password updated successfully", "success");
        });
      })
      .catch(() => {
        toastify("Current password is incorrect");
      });
  }
};
