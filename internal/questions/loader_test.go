package questions

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoader_Load(t *testing.T) {
	// Create a temporary directory for test questions
	tmpDir := t.TempDir()
	questionsDir := filepath.Join(tmpDir, "questions")
	if err := os.MkdirAll(questionsDir, 0755); err != nil {
		t.Fatalf("failed to create questions dir: %v", err)
	}

	// Create test index
	indexContent := `{
		"questions": [
			{
				"id": "01-test.txt",
				"file": "01-test.txt",
				"name": "Test Question",
				"complexity": 1,
				"description": "A test question"
			}
		]
	}`
	indexPath := filepath.Join(questionsDir, "index.json")
	if err := os.WriteFile(indexPath, []byte(indexContent), 0644); err != nil {
		t.Fatalf("failed to write index: %v", err)
	}

	// Create test question file
	questionContent := "This is a test question?"
	questionPath := filepath.Join(questionsDir, "01-test.txt")
	if err := os.WriteFile(questionPath, []byte(questionContent), 0644); err != nil {
		t.Fatalf("failed to write question: %v", err)
	}

	// Test loading
	loader := NewLoader(tmpDir)
	questions, err := loader.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if len(questions) != 1 {
		t.Errorf("Load() got %d questions, want 1", len(questions))
	}

	if questions[0] != questionContent {
		t.Errorf("Load() question = %q, want %q", questions[0], questionContent)
	}
}

func TestLoader_Count(t *testing.T) {
	// Create a temporary directory for test questions
	tmpDir := t.TempDir()
	questionsDir := filepath.Join(tmpDir, "questions")
	if err := os.MkdirAll(questionsDir, 0755); err != nil {
		t.Fatalf("failed to create questions dir: %v", err)
	}

	// Create test index with 3 questions
	indexContent := `{
		"questions": [
			{
				"id": "01-test1.txt",
				"file": "01-test1.txt",
				"name": "Test 1",
				"complexity": 1,
				"description": "Test 1"
			},
			{
				"id": "02-test2.txt",
				"file": "02-test2.txt",
				"name": "Test 2",
				"complexity": 2,
				"description": "Test 2"
			},
			{
				"id": "03-test3.txt",
				"file": "03-test3.txt",
				"name": "Test 3",
				"complexity": 3,
				"description": "Test 3"
			}
		]
	}`
	indexPath := filepath.Join(questionsDir, "index.json")
	if err := os.WriteFile(indexPath, []byte(indexContent), 0644); err != nil {
		t.Fatalf("failed to write index: %v", err)
	}

	loader := NewLoader(tmpDir)
	count, err := loader.Count()
	if err != nil {
		t.Fatalf("Count() error = %v", err)
	}

	if count != 3 {
		t.Errorf("Count() = %d, want 3", count)
	}
}

func TestLoader_Load_MissingIndex(t *testing.T) {
	tmpDir := t.TempDir()
	loader := NewLoader(tmpDir)

	_, err := loader.Load()
	if err == nil {
		t.Error("Load() expected error for missing index, got nil")
	}
}
