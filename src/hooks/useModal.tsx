import React, { useCallback } from 'react';
import ReactDOM from 'react-dom';

const modalRoot = document.querySelector('#modal-root');

export function useModal() {
  const showModal = useCallback(
    ({
      children,
      dismissableOnClick = true,
    }: {
      children: React.ReactElement | React.ReactElement[];
      dismissableOnClick?: boolean;
    }) => {
      if (!modalRoot) {
        console.warn('missing #modal-root');
        return;
      }

      ReactDOM.render(
        <ModalWrapper dismissableOnClick={dismissableOnClick}>
          {children}
        </ModalWrapper>,
        modalRoot
      );

      return {
        close: () => {
          ReactDOM.unmountComponentAtNode(modalRoot);
        },
      };
    },
    []
  );

  return showModal;
}

class ModalWrapper extends React.Component<
  {
    dismissableOnClick?: boolean;
  },
  { transition?: string; renderChildren?: boolean }
> {
  private ref = React.createRef<HTMLDivElement>();

  constructor(props: ModalWrapper['props']) {
    super(props);

    this.state = {};

    setTimeout(() => {
      this.setState({
        transition: `bg-opacity-30 bg-black 
      transition duration-1000 pointer-events-auto ease-in-out`,
        renderChildren: true,
      });
    }, 50);
  }

  render() {
    return (
      <div
        ref={this.ref}
        className={`
        absolute h-full w-full inset-0 z-50
        ${this.state.transition}
        `}
        onClick={() => {
          if (this.props.dismissableOnClick) {
            ReactDOM.unmountComponentAtNode(this.ref.current!.parentElement!);
          }
        }}
      >
        {this.state.renderChildren ? this.props.children : null}
      </div>
    );
  }
}
