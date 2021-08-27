import React, { useCallback } from 'react';
import ReactDOM from 'react-dom';

// const modalRoot = document.querySelector('#modal-root');

// export function useModal() {
//   const showModal = useCallback(
//     ({
//       children,
//       dismissableOnClick = true,
//     }: {
//       children: React.ReactElement | React.ReactElement[];
//       dismissableOnClick?: boolean;
//     }) => {
//       if (!modalRoot) {
//         console.warn('missing #modal-root');
//         return;
//       }

//       ReactDOM.render(
//         <ModalWrapper dismissableOnClick={dismissableOnClick}>
//           {children}
//         </ModalWrapper>,
//         modalRoot
//       );

//       return {
//         close: () => {
//           ReactDOM.unmountComponentAtNode(modalRoot);
//         },
//       };
//     },
//     []
//   );

//   return showModal;
// }

export class Modal extends React.Component<
  {
    dismissableOnClick?: boolean;
    open?: boolean;
    onClick?: VoidFunction;
  },
  { transition?: string; renderChildren?: boolean }
> {
  private ref = React.createRef<HTMLDivElement>();

  constructor(props: Modal['props']) {
    super(props);

    this.state = {};
  }

  componentDidUpdate(prevProps: Modal['props']) {
    if (prevProps.open !== this.props.open && this.props.open) {
      setTimeout(() => {
        this.setState({
          transition: `bg-opacity-30 bg-black 
        transition duration-1000 pointer-events-auto ease-in-out`,
          renderChildren: true,
        });
      }, 50);
    }
  }

  render() {
    if (!this.props.open) return <></>;

    return ReactDOM.createPortal(
      <div
        ref={this.ref}
        className={`absolute h-full w-full inset-0 z-50 ${this.state.transition}`}
        onClick={() => {
          if (this.props.dismissableOnClick) {
            ReactDOM.unmountComponentAtNode(this.ref.current!.parentElement!);
          }
        }}
      >
        {this.state.renderChildren ? this.props.children : null}
      </div>,
      document.body
    );
  }
}
