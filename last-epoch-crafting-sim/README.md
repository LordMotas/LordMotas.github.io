# Last Epoch Crafting Simulator

## Overview
The Last Epoch Crafting Simulator is a web application designed to mimic the crafting mechanics found in the game Last Epoch. This simulator allows users to experiment with different crafting options and see the potential outcomes based on various item properties and crafting requirements.

## Features
- **Item Management**: View and manage a variety of items with unique properties.
- **Crafting Logic**: Simulate the crafting process with realistic outcomes based on user input.
- **User Interface**: Intuitive UI for easy navigation and interaction with crafting options.

## Project Structure
```
last-epoch-crafting-sim
├── public
│   └── index.html          # Main HTML entry point
├── src
│   ├── styles
│   │   └── main.css        # Styles for the web application
│   ├── scripts
│   │   ├── main.ts         # Main TypeScript entry point
│   │   ├── simulator.ts     # Crafting logic
│   │   └── ui.ts           # User interface functions
│   └── data
│       └── items.json      # Item data for the simulator
├── package.json             # npm configuration
├── tsconfig.json            # TypeScript configuration
├── .gitignore               # Git ignore file
└── README.md                # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd last-epoch-crafting-sim
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```

## Usage
- Open your browser and navigate to `http://localhost:3000` to access the crafting simulator.
- Use the crafting panel to select items and initiate crafting processes.
- View results and update item displays as you interact with the simulator.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.