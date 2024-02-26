"""
module for streamlit searchbox component
"""
import functools
import logging
import os
from typing import Callable, List

import streamlit as st
import streamlit.components.v1 as components

# point to build directory
parent_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(parent_dir, "frontend/build")
if os.path.exists(build_dir):
    _get_react_component = components.declare_component(
        "searchbox",
        path=build_dir,
    )
else:
    _get_react_component = components.declare_component(
        "searchbox",
        url="http://localhost:3001"
    )

logger = logging.getLogger(__name__)


def wrap_inactive_session(func):
    """
    session state isn't available anymore due to rerun (as state key can't be empty)
    if the proxy is missing, this thread isn't really active and an early return is noop
    """

    @functools.wraps(func)
    def inner_function(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except KeyError as error:
            if kwargs.get("key", None) == error.args[0]:
                logger.debug(f"Session Proxy unavailable for key: {error.args[0]}")
                return

            raise error

    return inner_function


def _process_search(
    search_function: Callable[[str], List[any]],
    key: str,
    searchterm: str,
) -> bool:
    # nothing changed, avoid new search
    if searchterm == st.session_state[key]["search"]:
        return st.session_state[key]["result"]

    st.session_state[key]["search"] = searchterm
    search_results = search_function(searchterm)
    if search_results is None:
        search_results = []

    def _get_label(label: any) -> str:
        return str(label[0]) if isinstance(label, tuple) else str(label)

    def _get_value(value: any) -> any:
        return value[1] if isinstance(value, tuple) else value

    # used for react component
    st.session_state[key]["options"] = [
        {
            "label": _get_label(v),
            "value": i,
        }
        for i, v in enumerate(search_results)
    ]

    # used for proper return types
    st.session_state[key]["options_real_type"] = [_get_value(v) for v in search_results]

    st.experimental_rerun()


@wrap_inactive_session
def st_searchbox(
    search_function: Callable[[str], List[any]],
    placeholder: str="Search ...",
    label: str=None,
    default: any=None,
    clear_on_submit: bool=False,
    key: str="searchbox",
    on_change: Callable[[any], None]=None,
    initial_options: List[any]=[],
    is_required=False,
    **kwargs,
) -> any:
    """
    Create a new searchbox instance, that provides suggestions based on the user input
    and returns a selected option or empty string if nothing was selected

    Args:
        search_function (Callable[[str], List[any]]):
            Function that is called to fetch new suggestions after user input.
        placeholder (str, optional):
            Label shown in the searchbox. Defaults to "Search ...".
        label (str, optional):
            Label shown above the searchbox. Defaults to None.
        default (any, optional):
            Return value if nothing is selected so far. Defaults to None.
        clear_on_submit (bool, optional):
            Remove suggestions on select. Defaults to False.
        key (str, optional):
            Streamlit session key. Defaults to "searchbox".

    Returns:
        any: based on user selection
    """

    # key without prefix used by react component
    key_react = f"{key}_react"

    if key not in st.session_state:
        st.session_state[key] = {
            # updated after each selection / reset
            "result": default,
            # updated after each search keystroke
            "search": "",
            # updated after each search_function run
            "options": [],
        }

    # if key == "species":
    #     print(key, st.session_state[key])
    if st.session_state[key]["search"] == "":
        def _get_label(label: any) -> str:
            return str(label[0]) if isinstance(label, tuple) else str(label)

        def _get_value(value: any) -> any:
            return value[1] if isinstance(value, tuple) else value

        st.session_state[key]["options"] = [
            {
                "label": _get_label(v),
                "value": i,
            }
            for i, v in enumerate(initial_options)
        ]
        st.session_state[key]["options_real_type"] = [
            _get_value(v) for v in initial_options]

    # everything here is passed to react as this.props.args
    # print(f"DEFAULT ({key}): {default}")
    react_state = _get_react_component(
        options=st.session_state[key]["options"],
        clear_on_submit=clear_on_submit,
        placeholder=placeholder,
        label=label,
        is_required=is_required,
        # react return state within streamlit session_state
        key=key_react,
        value=default,
        **kwargs,
    )
    # if key == "species":
    #     print("REACT STATE", react_state)

    if react_state is None:
        if on_change:
            on_change(st.session_state[key]["result"])
        return st.session_state[key]["result"]

    interaction, value = react_state["interaction"], react_state["value"]

    if interaction == "search":
        # triggers rerun, no ops afterwards executed
        _process_search(search_function, key, value)

    if interaction == "submit":
        # if key == "species":
        #     print("SUBMITTED", st.session_state[key]["options_real_type"], value)
        st.session_state[key]["result"] = (
            st.session_state[key]["options_real_type"][value]
            if "options_real_type" in st.session_state[key] and type(value) == int
            else value
        )
        if on_change:
            on_change(st.session_state[key]["result"])
        return st.session_state[key]["result"]

    if interaction == "reset":
        st.session_state[key]["result"] = default
        if on_change:
            on_change(default)
        return default

    # no new react interaction happened
    return st.session_state[key]["result"]
