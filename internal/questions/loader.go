package questions

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type QuestionEntry struct {
	ID          string `json:"id"`
	File        string `json:"file"`
	Name        string `json:"name"`
	Complexity  int    `json:"complexity"`
	Description string `json:"description"`
}

type QuestionsIndex struct {
	Questions []QuestionEntry `json:"questions"`
}

type Loader struct {
	questionsDir string
	indexPath    string
}

func NewLoader(baseDir string) *Loader {
	return &Loader{
		questionsDir: filepath.Join(baseDir, "questions"),
		indexPath:    filepath.Join(baseDir, "questions", "index.json"),
	}
}

func (l *Loader) Load() ([]string, error) {
	if _, err := os.Stat(l.indexPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("questions index not found: %s", l.indexPath)
	}

	indexData, err := os.ReadFile(l.indexPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read questions index: %w", err)
	}

	var index QuestionsIndex
	if err := json.Unmarshal(indexData, &index); err != nil {
		return nil, fmt.Errorf("failed to parse questions index: %w", err)
	}

	questions := make([]string, 0, len(index.Questions))
	for _, entry := range index.Questions {
		questionPath := filepath.Join(l.questionsDir, entry.File)
		if _, err := os.Stat(questionPath); os.IsNotExist(err) {
			fmt.Printf("Warning: question file not found: %s, skipping...\n", entry.File)
			continue
		}

		questionData, err := os.ReadFile(questionPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read question file %s: %w", entry.File, err)
		}

		questions = append(questions, string(questionData))
	}

	if len(questions) == 0 {
		return nil, fmt.Errorf("no questions loaded from index")
	}

	fmt.Printf("Loaded %d question(s) from questions/\n\n", len(questions))
	return questions, nil
}

func (l *Loader) Count() (int, error) {
	if _, err := os.Stat(l.indexPath); os.IsNotExist(err) {
		return 0, fmt.Errorf("questions index not found: %s", l.indexPath)
	}

	indexData, err := os.ReadFile(l.indexPath)
	if err != nil {
		return 0, fmt.Errorf("failed to read questions index: %w", err)
	}

	var index QuestionsIndex
	if err := json.Unmarshal(indexData, &index); err != nil {
		return 0, fmt.Errorf("failed to parse questions index: %w", err)
	}

	return len(index.Questions), nil
}
