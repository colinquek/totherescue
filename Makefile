.PHONY: build test clean run-extract run-test run-load

build:
	go build -o bin/extract-tokens ./cmd/extract-tokens
	go build -o bin/test-chat ./cmd/test-chat
	go build -o bin/load-test ./cmd/load-test

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
	go run cmd/load-test/main.go

install: build
	cp bin/* $(GOPATH)/bin/ 2>/dev/null || cp bin/* ~/go/bin/
