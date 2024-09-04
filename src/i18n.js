import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import languages from "./assets/flags";

const resources = {
  english: {
    translation: {
      account: "Account",
      accountInfo: "Account info",
      accountManagement: "Account Management",
      accountNumber: "Account Number",
      action: "Action",
      active: "Active",
      activeAccount: "Active Account",
      additionalParameters: "Additional parameters",
      addressConfirmation: "Confirmation of residential address",
      addSymbol: "Add Symbol",
      allOperations: "All Operations",
      amount: "Amount",
      ANS1: "A: Our trading platform is an online system that allows you to buy and sell various financial instruments such as stocks, bonds, and cryptocurrencies.",
      ANS2: 'A: To create an account, click on the "Sign Up" button on our homepage and follow the registration process.',
      ANS3: 'A: You can reset your password by clicking on the "Forgot Password" link on the login page and following the instructions sent to your registered email address.',
      ANS4: "A: Yes, you can have multiple trading accounts with us. Contact our support team for assistance with setting up additional accounts.",
      ANS5: 'A: To place a trade, log in to your account, select the financial instrument you want to trade, specify the quantity and other details, and click "Place Order".',
      ANS6: "A: Our trading platform operates 24/7, but specific trading hours for different assets may vary. Check the asset's trading hours in the platform.",
      applicationSubmittedSuccess: "Application Submitted Successfully!",
      ask: "Ask",
      assets: "Assets",
      backSideId: "Backside of ID card/registration page/passport",
      balance: "Balance",
      balanceOperations: "Balance Operations",
      bid: "Bid",
      bonus: "Bonus",
      bonusSpent: "Bonus Spent",
      buy: "Buy",
      cancel: "Cancel",
      cardWalletNumber: "Card/Wallet number",
      changePassword: "Change Password",
      chooseFile: "Choose file",
      chooseMethod: "Choose Method",
      city: "City",
      close: "Close",
      closedPrice: "Closed Price",
      comment: "Comment",
      confirm: "Confirm",
      confirmPassword: "Confirm Password",
      country: "Country",
      createNewAccount: "Create New Account",
      creditCardBack: "Credit card back",
      creditCardFront: "Credit card front",
      currentPassword: "Current Password",
      currentPrice: "Current Price",
      dark: "Dark",
      date: "Date",
      dateRegister: "Date registered",
      delayed: "Delayed",
      deposit: "Deposit",
      deposited: "Deposited",
      depositFunds: "Deposit Funds",
      depositSubmit: "Your deposit was submitted!",
      dept: "Dept",
      edit: "Edit",
      email: "Email",
      equity: "Equity",
      exit: "Exit",
      FAQ: "Frequently Asked Questions",
      fileSizeLimit: "File size should be less than 10 MB",
      free: "Free",
      freeMargin: "Free margin",
      frontSideId: "Front side/first page of ID card/passport/ID card",
      fundsDepositedSuccess: "Funds Deposited Successfully!",
      fundsWithdrawal: "Funds withdrawal",
      furtherInstructions:
        "Please await further instructions from your manager.",
      GQ: "General Questions",
      help: "Help",
      last3Months: "Last 3 Months",
      lastMonth: "Last Month",
      lastWeek: "Last Week",
      level: "Level",
      light: "Light",
      limit: "Limit",
      margin: "Margin",
      marginlvl: "Margin lvl (%)",
      market: "Market",
      method: "Method",
      name: "Name",
      newDeal: "New deal",
      newOrder: "New order",
      newPassword: "New Password",
      openAccount: "Open an account",
      openAt: "Open at",
      openPrice: "Open Price",
      orderReport: "Report",
      ordersHistory: "Orders history",
      otherAccount: "Other Account",
      overview: "Overview",
      password: "Password",
      paymentMethod: "Payment Method",
      personalInfo: "Personal info",
      phone: "Phone",
      phoneNumber: "Phone number",
      profit: "Profit",
      purple: "Purple",
      Q1: "Q: What is our trading platform?",
      Q2: "Q: How do I create an account?",
      Q3: "Q: How can I reset my password?",
      Q4: "Q: Can I have multiple trading accounts?",
      Q5: "Q: How can I place a trade?",
      Q6: "Q: What are the trading hours?",
      referralCode: "Referral Code",
      reports: "Reports",
      requestSuccess: "Your request was successfully received!",
      save: "Save",
      selectAccount: "Select Account",
      sell: "Sell",
      slTp: "SL / TP",
      status: "Status",
      stopLoss: "Stop Loss",
      submit: "Submit",
      success: "Success!",
      surname: "Surname",
      symbol: "Symbol",
      takeProfit: "Take Profit",
      thankyou: "Thank you! Documents successfully sent for review!",
      today: "Today",
      total: "Total",
      totalDeals: "Total Deals",
      totalProfit: "Total Profit",
      trade: "Trade",
      tradeOperations: "Trade Operations",
      tradingInvestment: "Trading and Investments",
      transactions: "Transactions",
      type: "Type",
      upload: "Upload",
      uploadDocs: "Upload your verification documents",
      uploadDocuments: "Upload Your Documents for Verification",
      verification: "Verification",
      verified: "Verified",
      volume: "Volume",
      wait: "Please await your funds on the balance within 15 mins.",
      withdraw: "Withdraw",
      withdrawFunds: "Withdraw Funds",
      withdrawn: "Withdrawn",
    },
  },
  russian: {
    translation: {
      account: "Аккаунт",
      accountInfo: "Информация о счете",
      accountManagement: "Управление аккаунтом",
      accountNumber: "Номер счета",
      action: "Действие",
      active: "Активный",
      activeAccount: "Активный аккаунт",
      additionalParameters: "Дополнительные параметры",
      addressConfirmation: "Подтверждение адреса проживания",
      addSymbol: "Добавить символ",
      allOperations: "Все операции",
      amount: "Сумма",
      ANS1: "Ответ: Наша торговая платформа - это онлайн-система, которая позволяет вам покупать и продавать различные финансовые инструменты, такие как акции, облигации и криптовалюты.",
      ANS2: 'Ответ: Для создания аккаунта нажмите кнопку "Зарегистрироваться" на нашей домашней странице и следуйте процессу регистрации.',
      ANS3: 'Ответ: Вы можете сбросить пароль, нажав на ссылку "Забыли пароль" на странице входа и следуя инструкциям, отправленным на ваш зарегистрированный адрес электронной почты.',
      ANS4: "Ответ: Да, вы можете иметь несколько торговых аккаунтов у нас. Свяжитесь с нашей службой поддержки для помощи в настройке дополнительных аккаунтов.",
      ANS5: 'Ответ: Для размещения сделки войдите в свой аккаунт, выберите финансовый инструмент, в котором вы хотите торговать, укажите количество и другие детали, и нажмите "Разместить заказ".',
      ANS6: "Ответ: Наша торговая платформа работает круглосуточно, но конкретные часы торговли для разных активов могут различаться. Проверьте часы торговли актива на платформе.",
      applicationSubmittedSuccess: "Заявка успешно отправлена!",
      ask: "Спрос",
      assets: "Позиции",
      backSideId:
        "Обратная сторона удостоверения личности/страница регистрации/паспорта",
      balance: "Баланс",
      balanceOperations: "Операции с балансом",
      bid: "Предложение",
      bonus: "Бонус",
      bonusSpent: "Потраченный бонус",
      buy: "Купить",
      cancel: "Отменить",
      cardWalletNumber: "Номер карты/кошелька",
      changePassword: "Сменить пароль",
      chooseFile: "Выберите файл",
      chooseMethod: "Выберите метод",
      city: "Город",
      close: "Закрыть",
      comment: "Комментарий",
      confirm: "Подтвердить",
      confirmPassword: "Подтвердите пароль",
      country: "Страна",
      createNewAccount: "Создать новый аккаунт",
      creditCardBack: "Обратная сторона кредитной карты",
      creditCardFront: "Лицевая сторона кредитной карты",
      currentPassword: "Текущий пароль",
      currentPrice: "Текущая цена",
      dark: "Темный",
      date: "Дата",
      dateRegister: "Дата регистрации",
      delayed: "Задержанный",
      deposit: "Депозит",
      deposited: "Общий депозит",
      depositFunds: "Внести средства",
      depositSubmit: "Депозит успешно отправлен!",
      dept: "Залог",
      edit: "Редактировать",
      email: "Почта",
      equity: "Капитал",
      exit: "Выход",
      FAQ: "Часто задаваемые вопросы",
      fileSizeLimit: "Размер файла должен быть меньше 10 МБ",
      free: "Свободно",
      freeMargin: "Свободная маржа",
      frontSideId:
        "Лицевая сторона/первая страница удостоверения личности/паспорта",
      fundsDepositedSuccess: "Средства успешно зачислены!",
      fundsWithdrawal: "Вывод средств",
      furtherInstructions: "Ожидайте деталей от менеджера.",
      GQ: "Общие вопросы",
      help: "Помощь",
      last3Months: "За последние 3 месяца",
      lastMonth: "В прошлом месяце",
      lastWeek: "На прошлой неделе",
      level: "Уровень",
      light: "Светлый",
      limit: "Лимит",
      margin: "Маржа",
      marginlvl: "Уровень маржи (в %)",
      market: "Рынок",
      method: "Метод",
      name: "Имя",
      newDeal: "Детали сделки",
      newOrder: "Открыть сделку",
      newPassword: "Новый пароль",
      openAccount: "Открыть аккаунт",
      openAt: "Открыто на",
      openPrice: "Открытая цена",
      orderReport: "Отчет",
      ordersHistory: "История сделок",
      otherAccount: "Другой аккаунт",
      overview: "Обзор",
      password: "Пароль",
      paymentMethod: "Метод оплаты",
      personalInfo: "Личная информация",
      phone: "Телефон",
      phoneNumber: "Номер телефона",
      profit: "Профит",
      purple: "Фиолетовый",
      Q1: "В: Что такое наша торговая платформа?",
      Q2: "В: Как создать аккаунт?",
      Q3: "В: Как я могу сбросить свой пароль?",
      Q4: "В: Могу ли я иметь несколько торговых аккаунтов?",
      Q5: "В: Как сделать сделку?",
      Q6: "В: Каковы часы торговли?",
      referralCode: "Реферальный код",
      reports: "Отчеты",
      requestSuccess: "Запрос успешно принят в обработку!",
      save: "Сохранить",
      selectAccount: "Выберите аккаунт",
      sell: "Продать",
      slTp: "SL / TP",
      status: "Статус",
      stopLoss: "Стоп-лосс",
      submit: "Отправить",
      success: "Успешно!",
      surname: "Фамилия",
      symbol: "Символ",
      takeProfit: "Тейк-профит",
      thankyou: "Спасибо! Ваши документы успешно отправлены на проверку!",
      today: "Сегодня",
      total: "Общая прибыль",
      totalDeals: "Всего сделок",
      totalProfit: "Общая прибыль",
      trade: "Торговля",
      tradeOperations: "Торговые операции",
      tradingInvestment: "Торговля и инвестиции",
      transactions: "Транзакции",
      type: "Тип",
      upload: "Загрузить",
      uploadDocs: "Загрузите документы для верификации",
      uploadDocuments: "Загрузите ваши документы для верификации",
      verification: "Верификация",
      verified: "Подтверждено",
      volume: "Объем",
      wait: "Ожидайте поступления средств на баланс в течение 15 мин.",
      withdraw: "Вывод",
      withdrawFunds: "Вывести средства",
      withdrawn: "Всего выведено",
    },
  },
};

const lang = localStorage.getItem("lang");
const lng = lang && Object.keys(languages).includes(lang) ? lang : "english";

i18n.use(initReactI18next).init({
  fallbackLng: "english",
  interpolation: { escapeValue: false },
  lng,
  resources,
});

export default i18n;
