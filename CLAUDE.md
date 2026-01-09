### 🔄 Project Awareness & Context
- **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
- **Use venv_linux** (the virtual environment) whenever executing Python commands, including for unit tests.

### 🔧 Modify Before Create Principle
- **ALWAYS explore existing components FIRST** before creating new ones
- **Search for similar functionality** that can be modified or extended
- **Check reusable components** that might already solve the problem
- **Modify existing code** with simple but powerful changes when possible
- **Creating new components should be the LAST option**, not the first
- **When asked for new features**: 
  1. Search what already exists
  2. Identify what needs fixing/improving
  3. Modify in the simplest but most effective way
  4. Only create new if absolutely necessary

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
  For agents this looks like:
    - `agent.py` - Main agent definition and execution logic 
    - `tools.py` - Tool functions used by the agent 
    - `prompts.py` - System prompts
- **Use clear, consistent imports** (prefer relative imports within packages).
- **Use python_dotenv and load_env()** for environment variables.

### 🧪 Testing & Reliability
- **Always create Pytest unit tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.

### 📎 Style & Conventions
- **Use Python** as the primary language.
- **Follow PEP8**, use type hints, and format with `black`.
- **Use `pydantic` for data validation**.
- Use `FastAPI` for APIs and `SQLAlchemy` or `SQLModel` for ORM if applicable.
- Write **docstrings for every function** using the Google style:
  ```python
  def example():
      """
      Brief summary.

      Args:
          param1 (type): Description.

      Returns:
          type: Description.
      """
  ```

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Python packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.
- **NEVER hardcode API keys, secrets, or credentials in client-side code under any circumstances.**

### ⚡ Build & Testing Guidelines
- **DO NOT run `npm run build` for every small change** - it's unnecessary and slows down development
- **ONLY run `npm run build` when:**
  - Major feature implementations are complete
  - Need to verify TypeScript compilation for complex type changes
  - Before finalizing a significant architectural change
  - When explicitly requested by the user
- **For small edits** (text changes, minor fixes, styling adjustments): skip build verification
- **Use simple TypeScript inspection** to catch obvious errors instead of full builds