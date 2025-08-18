import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChapterPicker from "../ChapterPicker";
import { ChapterFiles } from "../../types";

const mockChapters: ChapterFiles[] = [
  {
    chapter: "Chapter 1 - HTML",
    files: [
      {
        id: "file1",
        originalName: "html-basics.pdf",
        size: 1024000,
        uploadedAt: new Date("2025-01-01"),
        chapter: "Chapter 1 - HTML",
        textContent: "Sample HTML content",
        mimeType: "application/pdf",
      },
    ],
  },
  {
    chapter: "Chapter 2 - CSS & JS",
    files: [
      {
        id: "file2",
        originalName: "css-fundamentals.pdf",
        size: 2048000,
        uploadedAt: new Date("2025-01-02"),
        chapter: "Chapter 2 - CSS & JS",
        textContent: "Sample CSS content",
        mimeType: "application/pdf",
      },
    ],
  },
];

describe("ChapterPicker", () => {
  const mockOnChapterSelect = jest.fn();

  beforeEach(() => {
    mockOnChapterSelect.mockClear();
  });

  it("renders chapter picker with chapters", () => {
    render(
      <ChapterPicker
        chapters={mockChapters}
        selectedChapter={null}
        onChapterSelect={mockOnChapterSelect}
        userRole="student"
      />
    );

    expect(screen.getByText("Capítulos")).toBeInTheDocument();
    expect(screen.getByText("Chapter 1 - HTML")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2 - CSS & JS")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
  });

  it("shows loading state", () => {
    render(
      <ChapterPicker
        chapters={[]}
        selectedChapter={null}
        onChapterSelect={mockOnChapterSelect}
        userRole="student"
        isLoading={true}
      />
    );

    expect(screen.getByText("Carregando capítulos...")).toBeInTheDocument();
  });

  it("shows empty state when no chapters", () => {
    render(
      <ChapterPicker
        chapters={[]}
        selectedChapter={null}
        onChapterSelect={mockOnChapterSelect}
        userRole="student"
      />
    );

    expect(screen.getByText("Nenhum capítulo disponível")).toBeInTheDocument();
  });

  it("handles chapter selection", () => {
    render(
      <ChapterPicker
        chapters={mockChapters}
        selectedChapter={null}
        onChapterSelect={mockOnChapterSelect}
        userRole="student"
      />
    );

    const chapterCard = screen
      .getByText("Chapter 1 - HTML")
      .closest(".chapter-item");
    fireEvent.click(chapterCard!);

    expect(mockOnChapterSelect).toHaveBeenCalledWith("Chapter 1 - HTML");
  });

  it("shows chapter details when selected", () => {
    render(
      <ChapterPicker
        chapters={mockChapters}
        selectedChapter="Chapter 1 - HTML"
        onChapterSelect={mockOnChapterSelect}
        userRole="student"
      />
    );

    expect(screen.getByText("html-basics.pdf")).toBeInTheDocument();
    expect(screen.getByText("1.0 MB")).toBeInTheDocument();
  });

  it("shows stats toggle for teachers", () => {
    render(
      <ChapterPicker
        chapters={mockChapters}
        selectedChapter="Chapter 1 - HTML"
        onChapterSelect={mockOnChapterSelect}
        userRole="teacher"
      />
    );

    expect(screen.getByText("Ver Estatísticas")).toBeInTheDocument();
  });

  it("shows teacher stats when enabled", () => {
    render(
      <ChapterPicker
        chapters={mockChapters}
        selectedChapter="Chapter 1 - HTML"
        onChapterSelect={mockOnChapterSelect}
        userRole="teacher"
      />
    );

    const statsButton = screen.getByText("Ver Estatísticas");
    fireEvent.click(statsButton);

    expect(screen.getByText("Perguntas Totais")).toBeInTheDocument();
    expect(screen.getByText("Nível de Dificuldade")).toBeInTheDocument();
    expect(screen.getByText("Tópicos Mais Perguntados")).toBeInTheDocument();
  });

  it("shows clear selection button when chapter is selected", () => {
    render(
      <ChapterPicker
        chapters={mockChapters}
        selectedChapter="Chapter 1 - HTML"
        onChapterSelect={mockOnChapterSelect}
        userRole="student"
      />
    );

    const clearButton = screen.getByTitle("Limpar seleção");
    fireEvent.click(clearButton);

    expect(mockOnChapterSelect).toHaveBeenCalledWith(null);
  });

  it("shows chapter items in list format", () => {
    render(
      <ChapterPicker
        chapters={mockChapters}
        selectedChapter={null}
        onChapterSelect={mockOnChapterSelect}
        userRole="student"
      />
    );

    // Should show chapters in list format with file counts
    expect(screen.getByText("Chapter 1 - HTML")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2 - CSS & JS")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2); // File counts
  });
});
