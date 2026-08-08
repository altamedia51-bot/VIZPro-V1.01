with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

old_history = """  const [projectState, setProjectState] = useState<Project>(initialProject);
  const [history, setHistory] = useState<Project[]>([initialProject]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyIndexRef = useRef(0);
  historyIndexRef.current = historyIndex;

  const setProject = useCallback((newProjectOrUpdater: React.SetStateAction<Project>) => {
    setProjectState(prev => {
        const nextProject = typeof newProjectOrUpdater === 'function' ? (newProjectOrUpdater as any)(prev) : newProjectOrUpdater;
        
        if (JSON.stringify(prev) !== JSON.stringify(nextProject)) {
            setHistory(prevHistory => {
                const newHistory = prevHistory.slice(0, historyIndexRef.current + 1);
                return [...newHistory, nextProject];
            });
            setHistoryIndex(prevIndex => prevIndex + 1);
        }

        return nextProject;
    });
  }, []);
  const project = projectState;

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setProjectState(history[prevIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setProjectState(history[nextIndex]);
    }
  }, [history, historyIndex]);"""

new_history = """  const [historyState, setHistoryState] = useState<{ past: Project[], present: Project, future: Project[] }>({
    past: [],
    present: initialProject,
    future: []
  });
  
  const project = historyState.present;

  const setProject = useCallback((newProjectOrUpdater: React.SetStateAction<Project>) => {
    setHistoryState(state => {
        const nextProject = typeof newProjectOrUpdater === 'function' ? (newProjectOrUpdater as any)(state.present) : newProjectOrUpdater;
        
        if (JSON.stringify(state.present) === JSON.stringify(nextProject)) {
            return state;
        }
        
        return {
            past: [...state.past, state.present],
            present: nextProject,
            future: []
        };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistoryState(state => {
      if (state.past.length === 0) return state;
      const newPast = [...state.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [state.present, ...state.future]
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryState(state => {
      if (state.future.length === 0) return state;
      const newFuture = [...state.future];
      const newPresent = newFuture.shift()!;
      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: newFuture
      };
    });
  }, []);
  
  // Variables for UI rendering
  const historyIndex = historyState.past.length;
  const history = [...historyState.past, historyState.present, ...historyState.future];"""

content = content.replace(old_history, new_history)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
