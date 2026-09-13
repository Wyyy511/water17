/*
 * Optional adapter helper. Do not include until existing host functions are supplied.
 * Load before waterpulse-home.js, or register the bridge before the user clicks.
 * No endpoint, selector, model identifier or host function name is assumed.
 */
window.createWaterPulseHomepageBridge = function ({ sendText, openUpload, downloadTemplate }) {
  const callbacks = { submit: sendText, upload: openUpload, template: downloadTemplate };
  return {
    async handleAction({ action, payload, source, version }) {
      const callback = callbacks[action];
      if (typeof callback !== 'function') {
        throw new Error('Homepage action has not been connected: ' + action);
      }
      // Return/reject the real operation Promise. Do not acknowledge before it succeeds.
      return await callback({ text: payload.text, source, version });
    }
  };
};

/* Host wiring sketch; replace the functions with existing, verified operations.

window.WaterPulseHomepageBridge = window.createWaterPulseHomepageBridge({
  sendText: ({ text }) => existingChatController.submit(text),
  openUpload: () => existingUploadController.open(),
  downloadTemplate: () => existingTemplateController.download()
});

The names above are illustrative placeholders, not functions observed in WaterPulse.
For React/Vue, wire the same actions to props/events; avoid two active DOM owners.
*/
