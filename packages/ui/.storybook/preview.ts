import type { Preview } from "@storybook/react-vite";

import "../src/styles.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "Frost Canvas",
      values: [
        { name: "Frost Canvas", value: "#f8fbfc" },
        { name: "Ink", value: "#16202a" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
};

export default preview;
