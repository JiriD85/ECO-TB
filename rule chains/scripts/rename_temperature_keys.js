// ============================================================
// Rename Temperature Keys for TS1 & TS2 - JavaScript
// Transforms temperature sensor data to canonical names
// Used in: RESI Device Rule Chain > "Rename Temperature Keys for TS1&TS2" Node
// ============================================================

if (metadata.deviceName && metadata.deviceName.includes('_TS1')) {
    if (msg.values && msg.values.hasOwnProperty('temperature')) {
        msg.values.auxT1_C = msg.values.temperature;
        delete msg.values.temperature;
    }
} else if (metadata.deviceName && metadata.deviceName.includes('_TS2')) {
    if (msg.values && msg.values.hasOwnProperty('temperature')) {
        msg.values.auxT2_C = msg.values.temperature;
        delete msg.values.temperature;
    }
}

return {
    msg: msg,
    metadata: metadata,
    msgType: msgType
};
