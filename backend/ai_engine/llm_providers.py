"""
llm_providers.py - LLM provider adapters for OpenAI, Anthropic, and Google Gemini.

Each provider implements the same interface:
    chat(system: str, user: str, model: str) -> str

This abstraction lets the AI Engine stay provider-agnostic — swapping LLMs
requires zero changes outside this file.

Supported providers (set per-company in Phase 5+):
  - "openai"    → GPT-4o, GPT-4o-mini, GPT-3.5-turbo, etc.
  - "anthropic" → Claude 3.5 Sonnet, Claude 3 Haiku, etc.
  - "gemini"    → Gemini 1.5 Pro, Gemini 1.5 Flash, etc.
"""

from __future__ import annotations

import os
from typing import Literal

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Type alias
# ---------------------------------------------------------------------------

ProviderName = Literal["openai", "anthropic", "gemini"]


# ---------------------------------------------------------------------------
# Default models per provider
# ---------------------------------------------------------------------------

DEFAULT_MODELS: dict[str, str] = {
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-haiku-20240307",
    "gemini": "gemini-1.5-flash",
}


# ---------------------------------------------------------------------------
# OpenAI adapter
# ---------------------------------------------------------------------------

def _chat_openai(system: str, user: str, model: str, api_key: str | None = None) -> str:
    """Call the OpenAI Chat Completions API."""
    from openai import OpenAI  # lazy import — only needed if provider is openai

    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        raise ValueError("OpenAI API key is missing. Please configure it in settings.")

    client = OpenAI(api_key=key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content or ""


# ---------------------------------------------------------------------------
# Anthropic adapter
# ---------------------------------------------------------------------------

def _chat_anthropic(system: str, user: str, model: str, api_key: str | None = None) -> str:
    """Call the Anthropic Messages API."""
    try:
        import anthropic  # lazy import
    except ImportError:
        raise ImportError(
            "The 'anthropic' package is required to use the Anthropic provider. "
            "Install it with: pip install anthropic"
        )

    key = api_key or os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise ValueError("Anthropic API key is missing. Please configure it in settings.")

    client = anthropic.Anthropic(api_key=key)
    response = client.messages.create(
        model=model,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return response.content[0].text if response.content else ""


# ---------------------------------------------------------------------------
# Google Gemini adapter
# ---------------------------------------------------------------------------

def _chat_gemini(system: str, user: str, model: str, api_key: str | None = None) -> str:
    """Call the Google Gemini GenerativeAI API."""
    try:
        import google.generativeai as genai  # lazy import
    except ImportError:
        raise ImportError(
            "The 'google-generativeai' package is required to use the Gemini provider. "
            "Install it with: pip install google-generativeai"
        )

    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("Gemini API key is missing. Please configure it in settings.")

    genai.configure(api_key=key)
    gemini_model = genai.GenerativeModel(
        model_name=model,
        system_instruction=system,
    )
    response = gemini_model.generate_content(user)
    return response.text or ""


# ---------------------------------------------------------------------------
# Unified interface
# ---------------------------------------------------------------------------

def chat(
    system: str,
    user: str,
    provider: ProviderName = "openai",
    model: str | None = None,
    api_key: str | None = None,
) -> str:
    """
    Send a chat message to the selected LLM provider and return the response text.

    Args:
        system:   System prompt to set the LLM's behavior.
        user:     The user message / prompt.
        provider: Which LLM provider to use ('openai', 'anthropic', 'gemini').
        model:    Model name override. Defaults to the provider's recommended default.
        api_key:  Company-specific API key (overrides environment variables if provided).

    Returns:
        The LLM's text response as a string.

    Raises:
        ValueError:    If the required API key is missing.
        ImportError:   If the provider's SDK is not installed.
        NotImplementedError: If the provider is not supported.
    """
    resolved_model = model or DEFAULT_MODELS.get(provider, "")

    if provider == "openai":
        return _chat_openai(system, user, resolved_model, api_key)
    elif provider == "anthropic":
        return _chat_anthropic(system, user, resolved_model, api_key)
    elif provider == "gemini":
        return _chat_gemini(system, user, resolved_model, api_key)
    else:
        raise NotImplementedError(
            f"Provider '{provider}' is not supported. "
            f"Choose from: {list(DEFAULT_MODELS.keys())}"
        )


def get_available_providers() -> list[dict]:
    """Return a list of all supported providers with their default models."""
    return [
        {
            "provider": name,
            "default_model": model,
            "env_key": {
                "openai": "OPENAI_API_KEY",
                "anthropic": "ANTHROPIC_API_KEY",
                "gemini": "GEMINI_API_KEY",
            }[name],
        }
        for name, model in DEFAULT_MODELS.items()
    ]
