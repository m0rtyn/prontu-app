# Pronto - Capoeira Progress Tracker

A minimalistic, modern Progressive Web App (PWA) for tracking your Capoeira training progress using deeply nested task lists and predefined training plans.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **📋 Hierarchical Task Management** - Create deeply nested task lists to break down complex training goals
- **🎯 Predefined Training Plans** - Built-in beginner and intermediate Capoeira training plans
- **💾 Save & Load Plans** - Create custom training plans and save them for later use
- **🔄 Drag & Drop** - Reorder tasks and reorganize your training structure intuitively
- **📱 Progressive Web App** - Install on any device and use offline
- **🌓 Dark Mode Support** - Automatic theme switching based on system preferences
- **📤 Import/Export** - Share training plans as JSON files
- **💪 Mobile-Optimized** - Large touch targets and responsive design for mobile training

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/prontu-app.git
cd prontu-app

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to see the app running.

### Build for Production

```bash
# Create optimized production build
pnpm build

# Preview production build locally
pnpm preview
```

## 📖 Usage

See the [About Page](./ABOUT.md) for detailed usage instructions and feature explanations.

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Database**: Dexie.js (IndexedDB wrapper)
- **Drag & Drop**: @dnd-kit
- **PWA**: vite-plugin-pwa
- **Styling**: Vanilla CSS with CSS Variables

## 📁 Project Structure

```
prontu-app/
├── src/
│   ├── components/
│   │   ├── TaskItem.jsx      # Recursive task component
│   │   ├── TaskList.jsx       # Main task list container
│   │   └── About.jsx          # About/Help page
│   ├── db/
│   │   └── db.js              # Dexie database setup
│   ├── data/
│   │   └── trainingPlans.js   # Predefined training plans
│   ├── App.jsx                # Main app component
│   ├── index.css              # Global styles
│   └── main.jsx               # App entry point
├── public/                    # Static assets
└── package.json
```

## 🎨 Key Features Explained

### Task Management
- Click any task title to edit it
- Use the **+** button to add subtasks
- Use the **×** button to delete tasks
- Drag tasks by the handle (⋮⋮) to reorder

### Training Plans
- **Load Plan**: Choose from built-in or custom plans
- **Save as Plan**: Save your current task list as a reusable plan
- **Export/Import**: Share plans as JSON files
- **Reset**: Clear all tasks and start fresh

### Settings Menu (⋮)
- **Reset Plan**: Clear current tasks
- **Hard Reset**: Delete database and reload (emergency recovery)

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

### Database Schema

The app uses IndexedDB via Dexie.js with two tables:

**tasks**
- `id` (auto-increment)
- `title` (string)
- `completed` (boolean)
- `parentId` (string, 'root' for top-level)
- `order` (number)
- `createdAt` (Date)

**plans**
- `id` (auto-increment)
- `title` (string)
- `description` (string)
- `tasks` (array of task objects)
- `isCustom` (boolean)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and Vite
- Drag and drop powered by @dnd-kit
- Database management by Dexie.js
- Inspired by the Capoeira community's dedication to continuous improvement

## 📧 Contact

Project Link: [https://github.com/yourusername/prontu-app](https://github.com/yourusername/prontu-app)

---

Made with ❤️ for the Capoeira community
