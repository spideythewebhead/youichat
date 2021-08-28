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
    onClick?: VoidFunction;
  },
  { transition?: string }
> {
  private ref = React.createRef<HTMLDivElement>();

  constructor(props: Modal['props']) {
    super(props);

    this.state = {
      transition: 'bg-opacity-0',
    };
  }

  private animIn() {
    setTimeout(() => {
      this.setState({
        transition: `bg-opacity-30`,
      });
    }, 5);
  }

  componentDidMount() {
    if (this.props.children) {
      this.animIn();
    }
  }

  componentDidUpdate(prevProps: Modal['props']) {
    if (prevProps.children !== this.props.children && this.props.children) {
      this.animIn();
    } else if (!this.props.children && prevProps.children) {
      this.setState({
        transition: 'bg-opacity-0',
      });
    }
  }

  render() {
    if (!this.props.children) return;

    return ReactDOM.createPortal(
      <div
        ref={this.ref}
        className={`absolute bg-black h-full w-full inset-0 z-50 pointer-events-auto transition delay-100 duration-500 ${this.state.transition}`}
        onClick={() => {
          if (this.props.dismissableOnClick) {
            this.props.onClick?.();
            // ReactDOM.unmountComponentAtNode(this.ref.current!.parentElement!);
          }
        }}
      >
        {this.props.children}
      </div>,
      document.body
    );
  }
}
