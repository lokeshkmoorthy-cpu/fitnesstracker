const todayIsoDate = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
export {
  nowIso,
  todayIsoDate
};
