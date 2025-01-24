import type { NodeExecutionState } from "@/registry/blocks/flow-01/types/flow";
import type { WorkflowDefinition } from "@/registry/blocks/flow-01/types/workflow";

export interface ExecutionProgress {
	nodeId: string;
	status: "processing" | "success" | "error";
	timestamp: string;
}

export interface WorkflowEventHandlers {
	onProgress: (progress: ExecutionProgress) => void;
	onNodeUpdate: (nodeId: string, state: NodeExecutionState) => void;
	onError: (error: Error, nodeId?: string) => void;
	onComplete: () => void;
}

export class WorkflowSSEClient {
	private abortController: AbortController | null = null;
	private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

	async connect(
		workflow: WorkflowDefinition,
		handlers: WorkflowEventHandlers,
	): Promise<void> {
		try {
			this.abortController = new AbortController();

			const response = await fetch("/api/workflow/execute", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "text/event-stream",
				},
				body: JSON.stringify({ workflow }),
				signal: this.abortController.signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			if (!response.body) {
				throw new Error("Response body is null");
			}

			this.reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			// eslint-disable-next-line no-constant-condition
			while (true) {
				const { done, value } = await this.reader.read();
				if (done) {
					break;
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						try {
							const data = JSON.parse(line.slice(6));

							switch (data.type) {
								case "progress": {
									handlers.onProgress({
										nodeId: data.nodeId,
										status: data.status,
										timestamp: data.timestamp,
									});
									break;
								}
								case "nodeUpdate": {
									handlers.onNodeUpdate(data.nodeId, data.executionState);
									break;
								}
								case "error": {
									handlers.onError(new Error(data.error), data.nodeId);
									break;
								}
								case "complete": {
									handlers.onComplete();
									this.disconnect();
									break;
								}
							}
						} catch (error) {
							console.error("Error parsing SSE data:", error);
						}
					}
				}
			}
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				// Ignore abort errors as they are expected when disconnecting
				return;
			}
			handlers.onError(
				error instanceof Error ? error : new Error("SSE connection failed"),
			);
		} finally {
			this.disconnect();
		}
	}

	disconnect(): void {
		if (this.reader) {
			this.reader.cancel();
			this.reader = null;
		}
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
	}
}
