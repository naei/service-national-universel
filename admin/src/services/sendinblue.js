class SendinBlue {
  logEvent(event_name, email, data = {}) {
    // if (process.env.NODE_ENV !== "production") return;
    console.log(event_name, { email }, data);
    if (!window.sendinblue) return;
    console.log(event_name, { email }, data);
    try {
      console.log("EVENT 0");
      window.sendinblue.track(event_name, { email }, { data });
    } catch (e) {
      console.log("e", e);
    }
  }
}

const API = new SendinBlue();
export default API;
