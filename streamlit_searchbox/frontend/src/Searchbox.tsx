import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import Select from "react-select"

import SearchboxStyle from "./styling"

interface State {
  menu: boolean,
  inputValue: string
}

interface StreamlitReturn {
  interaction: "submit" | "search" | "reset"
  value: any
}

export function streamlitReturn(interaction: string, value: any): void {
  Streamlit.setComponentValue({
    interaction: interaction,
    value: value,
  } as StreamlitReturn)
}

class Searchbox extends StreamlitComponentBase<State> {
  constructor(props: any) {
//     props.args.value = "_";
    super(props);
    this.state = {
      menu: false,
      inputValue: props.args.value
    };
    // if (props.args.value) {
    // this.state.inputValue = props.args.value;
    //     this.setState({inputValue: props.args.value});
    console.log("VALUE SET IN CONSTRUCTOR>", this.state, "<");
    // }
  }

  // public state = {
  //   menu: false,
  //   inputValue: "---"
  // }

  private style = new SearchboxStyle(this.props.theme!)
  private ref: any = React.createRef()


  // private onSearchInput = (input: string, change: any): void => {
  //   console.log("onSearchInput", input, "<>", change)
  //   // happens on selection
  //   if (input.length === 0) {
  //     this.setState({ menu: false })
  //     console.log("Closing the menu!")
  //     return
  //   }

  //   streamlitReturn("search", input)
  // }

  /**
   * new keystroke on searchbox
   * @param input
   * @param action
   * @returns
   */
  private handleInputChange = (inputValue: string, action: any) => {
    console.log("handleInputChange InputValue", inputValue);
    if (this.state.inputValue === "~") {
        this.setState({ inputValue: inputValue });
        console.log("after:", this.state.inputValue);
    }

    console.log("handleInputChange: action", action);
    if (action.action !== "input-blur" && action.action !== "menu-close") {
      this.setState({ inputValue: inputValue });
    }
    // console.log("state before returning from handleInputChange:", this.state)

    streamlitReturn("search", inputValue)
  }

  /**
   * input was selected from dropdown or focus changed
   * @param option
   * @returns
   */
  private onInputSelection(option: any): void {
    console.log("onInputSelection", option)
    // clear selection (X)
    if (option === null) {
      this.callbackReset()
      return
    }
    this.setState({
      menu: false,
      inputValue: option.label
    });
    // this.state.inputValue = option.label;
    console.log("After input selection", this.state);

    this.callbackSubmit(option)
  }

  /**
   * input was focused, let's select all text
   * @returns
   */
  private onFocus(): void {
    // console.log("onFocus:>", this.ref.current.inputRef);
    this.ref.current.inputRef.select();
  }

  /**
   * reset button was clicked
   */
  private callbackReset(): void {
    this.setState({
      menu: false,
      inputValue: ""
    })
    streamlitReturn("reset", null)
  }

  /**
   * submitted selection, clear optionally
   * @param option
   */
  private callbackSubmit(option: any) {
    console.log("callbackSubmit:>", option, this.state, "<");
    streamlitReturn("submit", option.value)

    if (this.props.args.clear_on_submit) {
      this.ref.current.select.clearValue()
    } else {
      this.setState({
        menu: false,
        inputValue: option.label
      })
    }
    console.log("END of callbackSubmit: >", this.state, "<");
  }

  /**
   * show searchbox with label on top
   * @returns
   */
  public render = (): ReactNode => {
    // pustit reset: kategoria, druh
    // nepustit reset: 
    // console.log("setting value:", this.props.args.key)

    const val = this.props.args.value;
    // if (this.props.args.key in ["species_category_react", "species_react"]) {
    //   console.log('col');
    //   this.state.inputValue = val;
    // } else {
    if (val) {
      // this.state.inputValue = val;
//       if (this.props.args.key === "species_category_react") {
//         console.log("Setting value:", val);
//       }
      
      this.setState({inputValue: val});
    }
    // }

      // console.log("setting value:", this.props.args.key, this.props.args.value);
      // if (this.props.args.value) {
        // console.log("changing state")
      // const val = this.props.args.value;
      // val = val === "" ? "" : (this.props.args.value || undefined);
      // this.state.inputValue = val;
      // }
    // }
    return (
      <div>
        {this.props.args.label ? (
          <div style={this.style.label}>{this.props.args.label}</div>
        ) : null}
        <Select
          // defaultValue={colourOptions[0]}
          // options={colourOptions}
          inputValue={this.state.inputValue}
          onInputChange={this.handleInputChange}

          // dereference on clear
          ref={this.ref}
          isClearable={true}
          isSearchable={true}
          styles={this.style.select}
          options={this.props.args.options}
          placeholder={this.props.args.placeholder}
          // component overrides
          components={{
            ClearIndicator: (props) => this.style.clearIndicator(props),
            DropdownIndicator: () => this.style.iconDropdown(this.state.menu),
            IndicatorSeparator: () => <div></div>,
          }}
          // handlers
          filterOption={(_, __) => true}
          onFocus={() => this.onFocus()}
          onChange={(e) => this.onInputSelection(e)}
          // onInputChange={(e, a) => this.onSearchInput(e, a)}
          onMenuOpen={() => this.setState({ menu: true })}
          onMenuClose={() => this.setState({ menu: false })}
          menuIsOpen={this.props.args.options && this.state.menu}
          // inputValue={val}
        />
      </div>
    )
  }
}
export default withStreamlitConnection(Searchbox)
