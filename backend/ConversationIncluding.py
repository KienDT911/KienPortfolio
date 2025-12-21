import json
import os

from typing import Annotated
from typing_extensions import TypedDict
from contextlib import ExitStack

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize the LLM
llm = ChatOpenAI(
    model="DeepSeek-V3",
    temperature=0,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://aiportalapi.stu-platform.live/use",
)

# No external tools are used; pure LLM assistant.

# Define a memory to store the conversation
stack = ExitStack()
Mymemory = stack.enter_context(SqliteSaver.from_conn_string("checkpoints.db"))

# Configuration for the memory saver
config = {"configurable": {"thread_id": "1"}}

class State(TypedDict):
    # Messages have the type "list". The `add_messages` function
    # in the annotation defines how this state key should be updated
    # (in this case, it appends messages to the list, rather than overwriting them)
    messages: Annotated[list, add_messages]

# No tool node needed when not using external tools.

#Define routable tools
# Routing not required; graph is a simple START -> chatbot -> END.

# Modification: tell the LLM which tools it can call
llm_with_tools = llm

#define a tool that uses the LLM with tools
def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

# The first argument is the unique node name
# The second argument is the function or object that will be called whenever
# the node is used.
graph_builder = StateGraph(State)

# Add nodes and edges to the graph (simple single-node flow)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_edge(START, "chatbot")
graph_builder.add_edge("chatbot", END)

#Compile the graph
graph = graph_builder.compile(checkpointer=Mymemory)

#Run the graph with streaming output
def stream_graph_updates(user_input: str) -> str:
    system_prompt = (
        "You are a helpful and friendly AI assistant. "
        "Answer questions on any topic with accuracy, clarity, and helpfulness. "
        "Keep responses concise but informative. "
        "Be conversational and engaging."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]
    answer = None
    for event in graph.stream(
        {"messages": messages},
        config = config
    ):
        for value in event.values():
            last_msg = value["messages"][-1]
            if last_msg.type == "ai" and last_msg.content:
                answer = last_msg.content  # capture the answer
    return answer if answer else "No answer found."

if __name__ == "__main__":
    while True:
        try:
            user_input = input("User: ")
            if user_input.lower() in ["quit", "exit", "q"]:
                stack.close()
                print("Goodbye!")
                break
            print("Assistant:", stream_graph_updates(user_input))
        except Exception as e:
            print(f"Error: {e}")
            break
