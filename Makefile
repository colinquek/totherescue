.PHONY: build test clean run-extract run-test run-load

build:
	go build -o bin/extract-tokens ./cmd/extract-tokens
	go build -o bin/test-chat ./cmd/test-chat
	go build -o bin/run-queries ./cmd/run-queries

test:
	go test ./...

vet:
	go vet ./...

clean:
	rm -rf bin/
	go clean

run-extract:
	go run cmd/extract-tokens/main.go

run-test:
	go run cmd/test-chat/main.go

run-load:
	go run cmd/run-queries/main.go

install: build
	cp bin/* $(GOPATH)/bin/ 2>/dev/null || cp bin/* ~/go/bin/
