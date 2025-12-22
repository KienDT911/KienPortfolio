import json
import os

from typing import Annotated
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize the LLM with configurable model and base_url
llm = ChatOpenAI(
    model=os.getenv("MODEL_NAME", "DeepSeek-V3"),  # Default to DeepSeek-V3 if not set
    temperature=0,
    max_tokens=500,
    timeout=None,
    max_retries=2,
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("BASE_URL") if os.getenv("BASE_URL") else None,  # Optional custom endpoint
)

# No external tools are used; pure LLM assistant.

# In-memory storage: conversation history persists during session, clears on page refresh (new session_id)
Mymemory = MemorySaver()

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

#Compile the graph with in-memory checkpointer (conversation history stored in RAM per session)
graph = graph_builder.compile(checkpointer=Mymemory)

#Run the graph with streaming output
def stream_graph_updates(user_input: str, session_id: str = "default") -> str:
    system_prompt = (
        "You are a helpful, polite, and professional AI assistant. "
        "CRITICAL REQUIREMENT: NEVER use emojis, emoticons, icons, or any Unicode symbols in your responses. "
        "Output ONLY plain text without any decorative characters. "
        "This includes no usage of: 🍕 ♟️ 🤖 🌐 🔮 or any similar symbols. "
        "Answer accurately and clearly using words only. "
        "Keep responses concise but informative. "
        "Maintain a respectful, businesslike tone. "
        "Remember: NO emojis or icons whatsoever in any part of your response."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]
    # Use session_id as thread_id - each page refresh creates new session_id, clearing history
    config = {"configurable": {"thread_id": session_id}}
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
                print("Goodbye!")
                break
            print("Assistant:", stream_graph_updates(user_input))
        except Exception as e:
            print(f"Error: {e}")
            break
