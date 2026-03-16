# SpreadsheetApp

A modern web application built with React and Vite for creating and managing spreadsheets, featuring robust multi-cell selection and formula support.

## Features

- **Spreadsheet Engine**: Custom-built engine handling dependencies, formula evaluation, and undo/redo operations.
- **Multi-cell Selection**:
  - Drag to select multiple cells.
  - Keyboard navigation with Arrow keys.
  - Shift + Arrow keys for range selection.
  - "Type to edit" support.
  - Enter key to edit selected cell or move selection down.
  - Delete/Backspace to clear selected ranges.
- **Formulas**: Support for basic arithmetic and functions like SUM, AVG, MIN, MAX.
- **Formatting**: Bold, Italic, Underline, Font Size, Colors, and Alignment.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/tauhidst07/spreadhsheet.git
cd SpreadsheetApp
```

### 2. Install Dependencies

Install all required project dependencies:

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

### 3. Run Development Server

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

Create an optimized production build:

```bash
npm run build
```

The build output will be in the `dist/` directory.

### 5. Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### 6. Lint Code

Run ESLint to check for code quality issues:

```bash
npm run lint
```

## Project Structure

```
SpreadsheetApp/
├── src/
│   ├── App.jsx           # Main React component
│   ├── App.css           # Application styles
│   ├── main.jsx          # Application entry point
│   ├── index.css         # Global styles
│   ├── assets/           # Static assets (images, icons, etc.)
│   └── engine/           # Core application logic
│       ├── core.js       # Engine core functionality
│       └── Components/   # Engine logic components
│           └── Multicell_selection.jsx # Selection hook and handlers
├── public/               # Static files served as-is
├── package.json          # Project dependencies and scripts
├── vite.config.js        # Vite configuration
├── eslint.config.js      # ESLint configuration
├── index.html            # HTML entry point
└── README.md             # This file
```

## Feature Highlights: Multi-Cell Selection

The multi-cell selection feature is powered by a custom React hook `useMultiCellSelection` (`src/engine/Components/Multicell_selection.jsx`), keeping the core logic isolated from the UI rendering.

### Implementation Details:

1.  **State Management**:
    - `selectedCell`: Acts as the **anchor** or active cell.
    - `selectionEnd`: Tracks the current extent of the selection range.
    - `isDragging`: Boolean flag to handle mouse drag events.

2.  **Interaction Logic**:
    - **Mouse**: `MouseDown` sets the anchor. `MouseEnter` updates `selectionEnd` dynamically as the user drags across the grid. A global `MouseUp` listener ensures dragging stops even if the cursor leaves the grid.
    - **Keyboard**:
        - **Shift + Arrow Keys**: Updates `selectionEnd` to expand/contract the rectangular selection.
        - **Type-to-Edit**: Detects character input on a selected cell to immediately switch to edit mode.
        - **Delete/Backspace**: Calculates the bounding box of the selection (Min/Max Row & Col) and clears all cells within that range in the engine.

3.  **Rendering**:
    - The grid rendering loop in `App.jsx` checks if a cell indices fall within the `selectedCell` and `selectionEnd` bounds.
    - Matches are styled with the `.range-selected` CSS class, applying a semi-transparent overlay.

## Technologies Used

- **React** - A JavaScript library for building user interfaces
- **Vite** - A next-generation frontend build tool
- **ESLint** - JavaScript linting utility
- **CSS** - Styling and layout

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure the code passes linting:
   ```bash
   npm run lint
   ```

3. Commit your changes:
   ```bash
   git commit -m "Add description of your changes"
   ```

4. Push to your fork and create a Pull Request

## Browser Support

This application works on all modern browsers that support ES2020+ JavaScript:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Dependencies won't install
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then reinstall: `rm -rf node_modules package-lock.json && npm install`

### Port 5173 already in use
- The dev server will automatically try the next available port
- Or specify a custom port: `npm run dev -- --port 3000`

### Build fails
- Ensure all dependencies are installed: `npm install`
- Clear any build cache: `rm -rf dist`
- Try rebuilding: `npm run build`



# task_AI_native_Office_intern
