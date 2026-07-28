package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/totherescue/internal/tokens"
)

func main() {
	fmt.Println("SomeGPT Token Extractor")
	fmt.Print("=========================\n")

	extractor := tokens.NewExtractor()

	fmt.Println("Launching browser...")
	fmt.Println("   - If you're already logged in to SomeGPT, just use that window")
	fmt.Print("   - If not, login in the new browser window\n")

	tokens, err := extractor.Extract()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	envPath, err := extractor.GetEnvPath()
	if err != nil {
		envPath = filepath.Join(".", ".env.local")
	}

	if err := extractor.SaveToFile(tokens, envPath); err != nil {
		fmt.Fprintf(os.Stderr, "Error saving tokens: %v\n", err)
		os.Exit(1)
	}

	fmt.Print("\nSetup Complete!\n")
	fmt.Println("Next Steps:")
	fmt.Println("   1. Run: go run cmd/test-chat/main.go  (to verify tokens work)")
	fmt.Println("   2. Run: go run cmd/load-test/main.go  (to start load testing)")
	fmt.Println("\nImportant:")
	fmt.Println("   - Tokens expire after ~1 hour")
	fmt.Println("   - Re-run this script to get fresh tokens")
	fmt.Print("   - Tokens are saved in .env.local (gitignored)\n")
}
