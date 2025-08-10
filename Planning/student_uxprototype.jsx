import React, { useState, useEffect } from 'react';

// Single-file React + Tailwind mockup prototype
// Default export: StudentUXPrototype
// Usage: drop into a Vite React + Tailwind project and render <StudentUXPrototype />

type Chapter = { id: string; title: string; order: number };
type Material = { id: string; chapterId: string; title: string; kind: 'pdf' | 'video' | 'page' };
type Thread = { id: string; title: string; chapterId?: string | null; status: 'open' | 'answered'; lastAt: string };

export default function StudentUXPrototype() {
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: 'c1', title: 'Geral', order: 0 },
    { id: 'c2', title: 'Capítulo 1 - HTML', order: 1 },
    { id: 'c3', title: 'Capítulo 2 - CSS & JS', order: 2 },
    { id: 'c4', title: 'Projeto', order: 3 },
    { id: 'c5', title: 'Avaliações', order: 4 },
  ]);

  const [materials] = useState<Material[]>([
    { id: 'm1', chapterId: 'c2', title: 'Aula 1 - Estrutura HTML', kind: 'page' },
    { id: 'm2', chapterId: 'c2', title: 'Slides - HTML (PDF)', kind: 'pdf' },
    { id: 'm3', chapterId: 'c3', title: 'CSS - Box Model (video)', kind: 'video' },
    { id: 'm4', chapterId: 'c4', title: 'Enunciado do Projeto (PDF)', kind: 'pdf' },
  ]);

  const [threads, setThreads] = useState<Thread[]>([
    { id: 't1', title: 'Dúvida: difference between <div> and <section>?', chapterId: 'c2', status: 'open', lastAt: '2025-08-10' },
    { id: 't2', title: 'Erro no exercício 3 (JS)', chapterId: 'c3', status: 'open', lastAt: '2025-08-09' },
    { id: 't3', title: 'Pergunta projeto - scope', chapterId: 'c4', status: 'answered', lastAt: '2025-08-07' },
    { id: 't4', title: 'Geral: nota final', chapterId: 'c5', status: 'open', lastAt: '2025-08-01' },
  ]);

  // UI state
  const [selectedChapter, setSelectedChapter] = useState<string>('c2');
  const [openMaterial, setOpenMaterial] = useState<Material | null>(null);
  const [showQuickAsk, setShowQuickAsk] = useState(false);
  const [draggingThreadId, setDraggingThreadId] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<{ prevChapterId?: string | null; threadId?: string } | null>(null);

  useEffect(() => {
    let t: number;
    if (undoState) t = window.setTimeout(() => setUndoState(null), 6000);
    return () => clearTimeout(t);
  }, [undoState]);

  function onDragStart(e: React.DragEvent, threadId: string) {
    e.dataTransfer.setData('text/plain', threadId);
    setDraggingThreadId(threadId);
  }

  function onDropToChapter(e: React.DragEvent, chapterId: string) {
    e.preventDefault();
    const threadId = e.dataTransfer.getData('text/plain');
    if (!threadId) return;
    setThreads(prev => {
      const prevThread = prev.find(t => t.id === threadId);
      const prevChapter = prevThread?.chapterId ?? null;
      const next = prev.map(t => (t.id === threadId ? { ...t, chapterId } : t));
      // set undo state
      setUndoState({ prevChapterId: prevChapter, threadId });
      return next;
    });
    setDraggingThreadId(null);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function undoMove() {
    if (!undoState?.threadId) return;
    setThreads(prev => prev.map(t => (t.id === undoState.threadId ? { ...t, chapterId: undoState.prevChapterId ?? null } : t)));
    setUndoState(null);
  }

  function openThreadListForChapter(chId: string) {
    setSelectedChapter(chId);
  }

  // QuickAsk submit mock
  function submitQuickAsk(payload: { text: string; preset: string }) {
    const newThread: Thread = {
      id: 't' + Math.floor(Math.random() * 10000),
      title: payload.text.slice(0, 60),
      chapterId: selectedChapter,
      status: 'open',
      lastAt: new Date().toISOString().slice(0, 10),
    };
    setThreads(prev => [newThread, ...prev]);
    setShowQuickAsk(false);
  }

  const chapterThreads = (chId: string) => threads.filter(t => t.chapterId === chId);

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-semibold">Desenvolvimento para a Internet</div>
          <div className="text-sm text-gray-500">2024/25 • ISCTE</div>
        </div>
        <div className="flex items-center gap-3">
          <input className="px-3 py-1 border rounded-md text-sm" placeholder="Procurar materiais ou perguntas" />
          <button onClick={() => setShowQuickAsk(true)} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">Pergunta rápida</button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Organizer */}
        <aside className="w-72 bg-white border-r p-3 overflow-auto">
          <div className="text-sm text-gray-600 mb-2">Capítulos</div>
          <ul className="space-y-1">
            {chapters.map(ch => (
              <li key={ch.id} className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${selectedChapter === ch.id ? 'bg-gray-100' : ''}`} onClick={() => openThreadListForChapter(ch.id)} onDragOver={onDragOver} onDrop={e => onDropToChapter(e, ch.id)}>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-indigo-500"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-sm font-medium">{ch.title}</span>
                </div>
                <div className="text-xs text-gray-500">{chapterThreads(ch.id).length}</div>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-sm text-gray-600">Minhas perguntas</div>
          <div className="mt-2 space-y-2">
            {threads.slice(0, 5).map(t => (
              <div key={t.id} className="p-2 bg-gray-50 rounded border flex items-center justify-between text-sm">
                <div className="truncate">{t.title}</div>
                <div className="ml-2 text-xs text-gray-400">{t.lastAt}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-sm text-gray-600">Atalhos</div>
          <div className="mt-2 flex flex-col gap-2">
            <button className="text-left text-sm p-2 rounded hover:bg-gray-100">Bookmarks</button>
            <button className="text-left text-sm p-2 rounded hover:bg-gray-100">Notas</button>
            <button className="text-left text-sm p-2 rounded hover:bg-gray-100">Timeline</button>
          </div>
        </aside>

        {/* Main pane */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{chapters.find(c => c.id === selectedChapter)?.title}</h2>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1 border rounded text-sm" onClick={() => setOpenMaterial(null)}>Ver lista</button>
              <button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={() => setShowQuickAsk(true)}>+ Nova pergunta</button>
            </div>
          </div>

          {/* Materials list */}
          <section className="grid grid-cols-1 gap-3">
            {materials.filter(m => m.chapterId === selectedChapter).map(m => (
              <article key={m.id} className="p-4 bg-white rounded-lg shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-gray-500">{m.kind.toUpperCase()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border rounded text-sm" onClick={() => setOpenMaterial(m)}>Abrir</button>
                  <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm" onClick={() => { setSelectedChapter(m.chapterId); setShowQuickAsk(true); }}>Perguntar sobre isto</button>
                </div>
              </article>
            ))}

            {/* If none */}
            {materials.filter(m => m.chapterId === selectedChapter).length === 0 && (
              <div className="p-6 bg-white rounded-lg text-gray-500">Sem materiais neste capítulo.</div>
            )}

            {/* Thread list for chapter */}
            <div className="mt-6">
              <div className="text-sm font-semibold mb-2">Threads — {chapterThreads(selectedChapter).length}</div>
              <div className="space-y-2">
                {chapterThreads(selectedChapter).map(t => (
                  <div key={t.id} draggable onDragStart={e => onDragStart(e, t.id)} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <div className="text-sm font-medium truncate w-96">{t.title}</div>
                      <div className="text-xs text-gray-400">Status: {t.status} • {t.lastAt}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1 text-sm border rounded">Abrir</button>
                      <button className="px-2 py-1 text-sm rounded bg-yellow-100">Pin</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Right rail */}
        <aside className="w-80 p-4 border-l bg-white overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500">Progresso do Capítulo</div>
              <div className="text-lg font-semibold">{Math.round((chapterThreads(selectedChapter).length / Math.max(1, materials.filter(m => m.chapterId === selectedChapter).length)) * 100)}%</div>
            </div>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">%</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-500">Próximas entregas</div>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="p-2 bg-gray-50 rounded">Projeto — 21 Nov</li>
              <li className="p-2 bg-gray-50 rounded">Exame Normal — 15 Dez</li>
            </ul>
          </div>

          <div>
            <div className="text-sm text-gray-500">Resumo das perguntas</div>
            <div className="mt-2 text-sm space-y-2">
              <div className="p-2 bg-gray-50 rounded">5 abertas • 2 com resposta do professor</div>
              <div className="p-2 bg-gray-50 rounded">Tópicos mais frequentes: CSS, Projeto</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer / Undo snackbar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        {undoState && (
          <div className="flex items-center gap-4 bg-gray-800 text-white px-4 py-2 rounded shadow">
            <div>Movido — <span className="font-medium">Desfazer?</span></div>
            <button onClick={undoMove} className="px-3 py-1 bg-white text-gray-800 rounded">Desfazer</button>
          </div>
        )}
      </div>

      {/* QuickAsk modal (simple mock) */}
      {showQuickAsk && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-[720px] bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Pergunta rápida</h3>
            <p className="text-sm text-gray-500 mb-4">Capítulo: {chapters.find(c => c.id === selectedChapter)?.title}</p>
            <textarea placeholder="Escreve a tua pergunta aqui" className="w-full h-28 p-2 border rounded mb-3" id="qtext"></textarea>
            <div className="flex items-center gap-3 mb-3">
              <select id="preset" className="p-2 border rounded text-sm">
                <option value="hints">Só dicas</option>
                <option value="steps">Mostrar passos</option>
                <option value="full">Solução completa</option>
              </select>
              <input type="file" className="text-sm" />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowQuickAsk(false)} className="px-3 py-1 border rounded">Cancelar</button>
              <button onClick={() => {
                const el = document.getElementById('qtext') as HTMLTextAreaElement | null;
                submitQuickAsk({ text: el?.value ?? 'Pergunta sem texto', preset: (document.getElementById('preset') as HTMLSelectElement).value });
              }} className="px-4 py-1 bg-indigo-600 text-white rounded">Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* Reader modal mock */}
      {openMaterial && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-[1000px] h-[700px] bg-white rounded-lg p-4 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-semibold">{openMaterial.title}</div>
                <div className="text-sm text-gray-500">{openMaterial.kind.toUpperCase()}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setOpenMaterial(null)} className="px-3 py-1 border rounded">Fechar</button>
              </div>
            </div>

            <div className="border p-4 rounded h-[560px] overflow-auto bg-gray-50">
              <p className="text-sm text-gray-700">Este é um mock do leitor de PDF/texto. Aqui aparecerá o conteúdo do ficheiro; o botão <span className="font-semibold">Explicar</span> gera um resumo e mostra os pontos onde os alunos têm mais dificuldades.</p>

              <div className="mt-4">
                <button className="px-3 py-1 bg-yellow-400 rounded mr-2">Explicar</button>
                <button className="px-3 py-1 bg-green-500 text-white rounded">Perguntar sobre seleção</button>
              </div>

              <div className="mt-6 text-sm text-gray-600">
                <strong>Exemplo de highlights</strong>
                <ul className="list-disc ml-5 mt-2 text-sm">
                  <li>Como funcionam as tags semânticas</li>
                  <li>Boas práticas para estruturação do documento</li>
                  <li>Exemplo prático: ficheiro index.html mínimo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
