const fs = require("fs");
const d = JSON.parse(fs.readFileSync("dashboards/measurements.json", "utf8"));
const w = d.configuration.widgets["6ccd99bd-8562-4e6b-e42b-e7f3c026a129"];
const actions = w.config.actions.elementClick || [];

// Replace the measurement-switch-button action with a simple test
const idx = actions.findIndex(a => a.name === "measurement-switch-button");
if (idx !== -1) {
    actions[idx].customFunction = 'console.log("BUTTON CLICKED!"); alert("Measurement Switch Button clicked!");';
    console.log("Updated action to simple test");
}

w.config.actions.elementClick = actions;
fs.writeFileSync("dashboards/measurements.json", JSON.stringify(d, null, 2));
